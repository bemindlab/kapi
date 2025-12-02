/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { ILightweightModeService } from '../../../services/lightweightMode/common/lightweightMode.js';
import { IStatusbarEntryAccessor, IStatusbarService, StatusbarAlignment } from '../../../services/statusbar/browser/statusbar.js';
import { localize } from '../../../../nls.js';

export class LightweightModeStatusBarContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.lightweightModeStatusBar';

	private readonly statusBarEntry = 'status.lightweightMode';
	private entryAccessor: IStatusbarEntryAccessor | undefined;

	constructor(
		@ILightweightModeService private readonly lightweightModeService: ILightweightModeService,
		@IStatusbarService private readonly statusbarService: IStatusbarService
	) {
		super();

		// Update status bar on mode change
		this._register(this.lightweightModeService.onDidChangeLightweightMode(() => {
			this.updateStatusBar();
		}));

		// Initial update
		this.updateStatusBar();
	}

	private updateStatusBar(): void {
		const isEnabled = this.lightweightModeService.isEnabled();

		if (isEnabled) {
			if (!this.entryAccessor) {
				// Show indicator when lightweight mode is active
				this.entryAccessor = this.statusbarService.addEntry(
					{
						name: localize('lightweightMode', "Lightweight Mode"),
						text: '$(zap) Lightweight',
						tooltip: localize('lightweightMode.tooltip', "Lightweight Editor Mode is active. Click to toggle."),
						command: 'workbench.action.toggleLightweightMode',
						ariaLabel: localize('lightweightMode.aria', "Lightweight Mode Active")
					},
					this.statusBarEntry,
					StatusbarAlignment.RIGHT,
					100
				);
			}
		} else {
			// Remove indicator when lightweight mode is inactive
			this.entryAccessor?.dispose();
			this.entryAccessor = undefined;
		}

		// Mode change is announced via the status bar entry tooltip and aria-label
		// No additional notification needed
	}
}
