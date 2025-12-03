/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { ILightweightModeService } from '../../../services/lightweightMode/common/lightweightMode.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';

export class LightweightModeExtensionContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.lightweightModeExtension';

	private previousExtensionRecommendationsEnabled: boolean | undefined;

	constructor(
		@ILightweightModeService private readonly lightweightModeService: ILightweightModeService,
		@IConfigurationService private readonly configurationService: IConfigurationService
	) {
		super();

		// Apply initial state
		if (this.lightweightModeService.isEnabled()) {
			this.applyExtensionSettings();
		}

		// Listen for mode changes
		this._register(this.lightweightModeService.onDidChangeLightweightMode(enabled => {
			if (enabled) {
				this.applyExtensionSettings();
			} else {
				this.restoreExtensionSettings();
			}
		}));

		// Listen for configuration changes while mode is active
		this._register(this.configurationService.onDidChangeConfiguration(e => {
			if (this.lightweightModeService.isEnabled() &&
				e.affectsConfiguration('workbench.lightweightMode')) {
				this.applyExtensionSettings();
			}
		}));
	}

	private applyExtensionSettings(): void {
		const config = this.lightweightModeService.getConfiguration();

		// Hide extension recommendations if configured
		if (config.hideExtensionRecommendations) {
			this.previousExtensionRecommendationsEnabled = this.configurationService.getValue<boolean>('extensions.ignoreRecommendations');
			// Set to true to ignore/hide recommendations
			if (this.previousExtensionRecommendationsEnabled !== true) {
				this.configurationService.updateValue('extensions.ignoreRecommendations', true);
			}
		}
	}

	private restoreExtensionSettings(): void {
		// Restore extension recommendations setting
		if (this.previousExtensionRecommendationsEnabled !== undefined) {
			this.configurationService.updateValue('extensions.ignoreRecommendations', this.previousExtensionRecommendationsEnabled);
			this.previousExtensionRecommendationsEnabled = undefined;
		}
	}
}
