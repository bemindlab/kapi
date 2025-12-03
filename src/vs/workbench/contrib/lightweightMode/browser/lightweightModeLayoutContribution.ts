/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { ILightweightModeService } from '../../../services/lightweightMode/common/lightweightMode.js';
import { IWorkbenchLayoutService, Parts } from '../../../services/layout/browser/layoutService.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { LightweightModeAnimationController } from './lightweightModeAnimations.js';

export class LightweightModeLayoutContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.lightweightModeLayout';

	private previousPartVisibility: { [key: string]: boolean } = {};
	private animationController: LightweightModeAnimationController;

	constructor(
		@ILightweightModeService private readonly lightweightModeService: ILightweightModeService,
		@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService,
		@IConfigurationService private readonly configurationService: IConfigurationService
	) {
		super();

		// Initialize animation controller
		this.animationController = this._register(new LightweightModeAnimationController(this.layoutService));

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

	private async applyLightweightMode(): Promise<void> {
		// Store current visibility state before hiding
		this.previousPartVisibility = {};

		// Collect parts to animate
		const partsToHide: Parts[] = [];

		// Hide activity bar if configured (using centralized accessor)
		if (this.lightweightModeService.hideActivityBar) {
			const isVisible = this.layoutService.isVisible(Parts.ACTIVITYBAR_PART);
			this.previousPartVisibility[Parts.ACTIVITYBAR_PART] = isVisible;
			if (isVisible) {
				partsToHide.push(Parts.ACTIVITYBAR_PART);
			}
		}

		// Hide status bar if configured (using centralized accessor)
		if (this.lightweightModeService.hideStatusBar) {
			this.previousPartVisibility[Parts.STATUSBAR_PART] = true;
			partsToHide.push(Parts.STATUSBAR_PART);
		}

		// Animate all parts concurrently
		await Promise.all(partsToHide.map(part =>
			this.animationController.animatePartVisibility(part, true)
		));
	}

	private async restoreNormalMode(): Promise<void> {
		// Collect parts to restore
		const partsToShow: Parts[] = [];

		// Restore previously hidden parts
		if (this.previousPartVisibility[Parts.ACTIVITYBAR_PART]) {
			partsToShow.push(Parts.ACTIVITYBAR_PART);
		}
		if (this.previousPartVisibility[Parts.STATUSBAR_PART]) {
			partsToShow.push(Parts.STATUSBAR_PART);
		}

		// Animate all parts concurrently
		await Promise.all(partsToShow.map(part =>
			this.animationController.animatePartVisibility(part, false)
		));

		this.previousPartVisibility = {};
	}
}
