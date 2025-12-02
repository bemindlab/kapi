/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { ILightweightModeService } from '../../../services/lightweightMode/common/lightweightMode.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';

export class LightweightModeScmContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.lightweightModeScm';

	private previousGitDecorationsEnabled: boolean | undefined;

	constructor(
		@ILightweightModeService private readonly lightweightModeService: ILightweightModeService,
		@IConfigurationService private readonly configurationService: IConfigurationService
	) {
		super();

		// Apply initial state
		if (this.lightweightModeService.isEnabled()) {
			this.applyScmSettings();
		}

		// Listen for mode changes
		this._register(this.lightweightModeService.onDidChangeLightweightMode(enabled => {
			if (enabled) {
				this.applyScmSettings();
			} else {
				this.restoreScmSettings();
			}
		}));
	}

	private applyScmSettings(): void {
		const config = this.lightweightModeService.getConfiguration();

		// Hide git decorations if configured
		if (config.hideGitDecorations) {
			this.previousGitDecorationsEnabled = this.configurationService.getValue<boolean>('git.decorations.enabled');
			if (this.previousGitDecorationsEnabled !== false) {
				this.configurationService.updateValue('git.decorations.enabled', false);
			}
		}
	}

	private restoreScmSettings(): void {
		// Restore git decorations setting
		if (this.previousGitDecorationsEnabled !== undefined) {
			this.configurationService.updateValue('git.decorations.enabled', this.previousGitDecorationsEnabled);
			this.previousGitDecorationsEnabled = undefined;
		}
	}
}
