/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// @ts-check
/**
 * @fileoverview Common build script for extension scripts used in in webviews.
 */
import path from 'node:path';
import esbuild from 'esbuild';

/**
 * @typedef {Partial<import('esbuild').BuildOptions> & {
 * 	entryPoints: string[] | Record<string, string> | { in: string, out: string }[];
 * 	outdir: string;
 * }} BuildOptions
 */

/**
 * Build the source code once using esbuild.
 *
 * @param {BuildOptions} options
 * @param {(outDir: string) => unknown} [didBuild]
 */
async function build(options, didBuild) {
	await esbuild.build({
		bundle: true,
		minify: true,
		sourcemap: false,
		format: 'esm',
		platform: 'browser',
		target: ['es2024'],
		...options,
	});

	await didBuild?.(options.outdir);
}

const buildDidBuildPlugin = (outdir, didBuild) => ({
	name: 'did-build-callback',
	setup(build) {
		build.onEnd(async (result) => {
			if (result.errors.length > 0 || !didBuild) {
				return;
			}

			try {
				await didBuild(outdir);
			} catch (err) {
				console.error(err);
			}
		});
	},
});

/**
 * @param {{
 * 	srcDir: string;
 *  outdir: string;
 *  entryPoints: string[] | Record<string, string> | { in: string, out: string }[];
 * 	additionalOptions?: Partial<import('esbuild').BuildOptions>
 * }} config
 * @param {string[]} args
 * @param {(outDir: string) => unknown} [didBuild]
 */
export async function run(config, args, didBuild) {
	let outdir = config.outdir;
	const outputRootIndex = args.indexOf('--outputRoot');
	if (outputRootIndex >= 0) {
		const outputRoot = args[outputRootIndex + 1];
		const outputDirName = path.basename(outdir);
		outdir = path.join(outputRoot, outputDirName);
	}

	/** @type {BuildOptions} */
	const resolvedOptions = {
		entryPoints: config.entryPoints,
		outdir,
		logOverride: {
			'import-is-undefined': 'error',
		},
		...(config.additionalOptions || {}),
	};

	const isWatch = args.indexOf('--watch') >= 0;
	if (isWatch) {
		const plugins = resolvedOptions.plugins?.slice() ?? [];
		if (didBuild) {
			plugins.push(buildDidBuildPlugin(outdir, didBuild));
		}
		const ctx = await esbuild.context({
			...resolvedOptions,
			plugins,
		});
		await ctx.watch();
	} else {
		return build(resolvedOptions, didBuild).catch(() => process.exit(1));
	}
}
