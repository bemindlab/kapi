/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { join, resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';


// Polyfill for __dirname (Node.js v22+ feature)
const __dirname = import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : undefined;
const rootPath = resolve(__dirname, '..', '..', '..');
const vscodePath = join(rootPath, 'vscode');
const distroPath = join(rootPath, 'vscode-distro');
const commit = execSync('git rev-parse HEAD', { cwd: distroPath, encoding: 'utf8' }).trim();
const packageJsonPath = join(vscodePath, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

packageJson.distro = commit;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
