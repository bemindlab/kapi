/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'mocha';
import { deepStrictEqual, strictEqual } from 'node:assert';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { MarkdownString } from 'vscode';
import { PathExecutableCache } from '../../env/pathExecutableCache';

suite('PathExecutableCache', () => {
	test('cache should return empty for empty PATH', async () => {
		const cache = new PathExecutableCache();
		const result = await cache.getExecutablesInPath({ PATH: '' });
		strictEqual(Array.from(result!.completionResources!).length, 0);
		strictEqual(Array.from(result!.labels!).length, 0);
	});

	test('results are the same on successive calls', async () => {
		const cache = new PathExecutableCache();
		const env = { PATH: process.env.PATH };
		const result = await cache.getExecutablesInPath(env);
		const result2 = await cache.getExecutablesInPath(env);
		deepStrictEqual(result!.labels, result2!.labels);
	});

	test('refresh clears the cache', async () => {
		const cache = new PathExecutableCache();
		const env = { PATH: process.env.PATH };
		const result = await cache.getExecutablesInPath(env);
		cache.refresh();
		const result2 = await cache.getExecutablesInPath(env);
		strictEqual(result !== result2, true);
	});

	if (process.platform !== 'win32') {
		test('cache should include executables found via symbolic links', async () => {
			const fixtureDir = path.resolve(__dirname.replace(/out[\/].*$/, 'src/test/env'), '../fixtures/symlink-test');
			const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'terminal-symlink-'));
			const realExecutableSource = path.join(fixtureDir, 'real-executable.sh');
			const realExecutableTarget = path.join(tempDir, 'real-executable.sh');
			const symlinkTarget = path.join(tempDir, 'symlink-executable.sh');

			try {
				fs.copyFileSync(realExecutableSource, realExecutableTarget);
				fs.chmodSync(realExecutableTarget, 0o755);
				fs.symlinkSync(realExecutableTarget, symlinkTarget);

				const env = { PATH: tempDir };
				const cache = new PathExecutableCache();
				const result = await cache.getExecutablesInPath(env);
				cache.refresh();
				const labels = Array.from(result!.labels!);

				strictEqual(labels.includes('real-executable.sh'), true);
				strictEqual(labels.includes('symlink-executable.sh'), true);
				strictEqual(result?.completionResources?.size, 2);

				const completionResources = result!.completionResources!;
				let realDocRaw: string | MarkdownString | undefined = undefined;
				let symlinkDocRaw: string | MarkdownString | undefined = undefined;
				for (const resource of completionResources) {
					if (resource.label === 'real-executable.sh') {
						realDocRaw = resource.documentation;
					} else if (resource.label === 'symlink-executable.sh') {
						symlinkDocRaw = resource.documentation;
					}
				}
				const realDoc = typeof realDocRaw === 'string' ? realDocRaw : (realDocRaw && 'value' in realDocRaw ? realDocRaw.value : undefined);
				const symlinkDoc = typeof symlinkDocRaw === 'string' ? symlinkDocRaw : (symlinkDocRaw && 'value' in symlinkDocRaw ? symlinkDocRaw.value : undefined);

				strictEqual(realDoc, realExecutableTarget);
				strictEqual(symlinkDoc, `${symlinkTarget} -> ${realExecutableTarget}`);
			} finally {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		});
	}
});
