/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { ILightweightModeService } from '../../../services/lightweightMode/common/lightweightMode.js';
import { IWorkbenchLayoutService, Parts } from '../../../services/layout/browser/layoutService.js';

export class LightweightModeDebugContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.lightweightModeDebug';

	private previousPanelVisibility: boolean | undefined;

	constructor(
		@ILightweightModeService private readonly lightweightModeService: ILightweightModeService,
		@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService
	) {
		super();

		// Apply initial state
		if (this.lightweightModeService.isEnabled()) {
			this.applyDebugSettings();
		}

		// Listen for mode changes
		this._register(this.lightweightModeService.onDidChangeLightweightMode(enabled => {
			if (enabled) {
				this.applyDebugSettings();
			} else {
				this.restoreDebugSettings();
			}
		}));
	}

	private applyDebugSettings(): void {
		// Note: Debug toolbar and status bar items are typically shown contextually
		// when debugging is active. In lightweight mode, we don't need to explicitly
		// hide them as they won't be shown unless debugging is started.
		// The panel (which contains debug console) can be hidden if desired.

		// For now, we'll leave the panel visible as it's useful for terminal access
		// This can be extended in the future to hide specific debug-related views
	}

	private restoreDebugSettings(): void {
		// Restore panel visibility if it was hidden
		if (this.previousPanelVisibility !== undefined) {
			this.layoutService.setPartHidden(!this.previousPanelVisibility, Parts.PANEL_PART);
			this.previousPanelVisibility = undefined;
		}
	}
}
