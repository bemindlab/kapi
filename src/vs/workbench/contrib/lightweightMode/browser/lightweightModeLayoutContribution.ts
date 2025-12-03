/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { ILightweightModeService } from '../../../services/lightweightMode/common/lightweightMode.js';
import { IWorkbenchLayoutService, Parts } from '../../../services/layout/browser/layoutService.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';

export class LightweightModeLayoutContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.lightweightModeLayout';

	private previousPartVisibility: { [key: string]: boolean } = {};

	constructor(
		@ILightweightModeService private readonly lightweightModeService: ILightweightModeService,
		@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService,
		@IConfigurationService private readonly configurationService: IConfigurationService
	) {
		super();

		// Apply initial state
		if (this.lightweightModeService.isEnabled()) {
			this.applyLightweightMode();
		}

		// Listen for mode changes
		this._register(this.lightweightModeService.onDidChangeLightweightMode(enabled => {
			if (enabled) {
				this.applyLightweightMode();
			} else {
				this.restoreNormalMode();
			}
		}));

		// Listen for configuration changes while mode is active
		this._register(this.configurationService.onDidChangeConfiguration(e => {
			// Only react if lightweight mode is enabled and relevant settings changed
			if (this.lightweightModeService.isEnabled() &&
				e.affectsConfiguration('workbench.lightweightMode')) {
				// Re-apply settings with new configuration
				this.applyLightweightMode();
			}
		}));
	}

	private applyLightweightMode(): void {
		// Store current visibility state before hiding
		this.previousPartVisibility = {};

		// Hide activity bar if configured (using centralized accessor)
		if (this.lightweightModeService.hideActivityBar) {
			const isVisible = this.layoutService.isVisible(Parts.ACTIVITYBAR_PART);
			this.previousPartVisibility[Parts.ACTIVITYBAR_PART] = isVisible;
			if (isVisible) {
				this.layoutService.setPartHidden(true, Parts.ACTIVITYBAR_PART);
			}
		}

		// Hide status bar if configured (using centralized accessor)
		if (this.lightweightModeService.hideStatusBar) {
			this.previousPartVisibility[Parts.STATUSBAR_PART] = true;
			this.layoutService.setPartHidden(true, Parts.STATUSBAR_PART);
		}
	}

	private restoreNormalMode(): void {
		// Restore previously hidden parts
		if (this.previousPartVisibility[Parts.ACTIVITYBAR_PART]) {
			this.layoutService.setPartHidden(false, Parts.ACTIVITYBAR_PART);
		}
		if (this.previousPartVisibility[Parts.STATUSBAR_PART]) {
			this.layoutService.setPartHidden(false, Parts.STATUSBAR_PART);
		}

		this.previousPartVisibility = {};
	}
}
