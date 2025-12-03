/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { ILightweightModeService } from '../../../services/lightweightMode/common/lightweightMode.js';
import { ILightweightModeProfileService } from '../../../services/lightweightMode/common/lightweightModeProfiles.js';
import { IStatusbarEntryAccessor, IStatusbarService, StatusbarAlignment } from '../../../services/statusbar/browser/statusbar.js';
import { localize } from '../../../../nls.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';

export class LightweightModeStatusBarContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.lightweightModeStatusBar';

	private readonly statusBarEntry = 'status.lightweightMode';
	private readonly firstToggleKey = 'workbench.lightweightMode.firstToggleShown';
	private entryAccessor: IStatusbarEntryAccessor | undefined;

	constructor(
		@ILightweightModeService private readonly lightweightModeService: ILightweightModeService,
		@ILightweightModeProfileService private readonly profileService: ILightweightModeProfileService,
		@IStatusbarService private readonly statusbarService: IStatusbarService,
		@INotificationService private readonly notificationService: INotificationService,
		@IStorageService private readonly storageService: IStorageService,
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@IKeybindingService private readonly keybindingService: IKeybindingService
	) {
		super();

		// Update status bar on mode change
		this._register(this.lightweightModeService.onDidChangeLightweightMode(enabled => {
			this.updateStatusBar();

			// Show notification on first toggle
			if (enabled && !this.hasShownFirstToggleNotification()) {
				this.showFirstToggleNotification();
				this.markFirstToggleNotificationShown();
			}
		}));

		// Update status bar on profile change
		this._register(this.profileService.onDidChangeActiveProfile(() => {
			this.updateStatusBar();
		}));

		// Listen for configuration changes (status bar visibility)
		this._register(this.configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('workbench.lightweightMode.hideStatusBar')) {
				this.updateStatusBar();
			}
		}));

		// Initial update
		this.updateStatusBar();
	}

	private updateStatusBar(): void {
		const isEnabled = this.lightweightModeService.isEnabled();
		const statusBarHidden = this.lightweightModeService.hideStatusBar;

		// Only show status bar indicator if:
		// 1. Lightweight mode is enabled
		// 2. Status bar itself is not hidden (otherwise the indicator can't be seen)
		if (isEnabled && !statusBarHidden) {
			// Get active profile information
			const activeProfileId = this.profileService.getActiveProfileId();
			const activeProfile = activeProfileId ? this.profileService.getProfile(activeProfileId) : undefined;

			// Build status bar text and tooltip
			let text = '$(zap) Lightweight';
			let tooltipText: string;

			if (activeProfile) {
				text = `$(${activeProfile.icon}) ${activeProfile.name}`;
				const baseTooltip = localize(
					'lightweightMode.tooltipWithProfile',
					"Lightweight Mode: {0}. Click to switch profiles.",
					activeProfile.name
				);
				const helpText = localize('lightweightMode.tooltipHelp', "Right-click for help and settings");
				tooltipText = `${baseTooltip}\n${helpText}`;
			} else {
				const keybinding = this.keybindingService.lookupKeybinding('workbench.action.toggleLightweightMode');
				const keybindingLabel = keybinding?.getLabel();
				const baseTooltip = keybindingLabel
					? localize('lightweightMode.tooltipWithShortcut', "Lightweight Editor Mode is active. Click or press {0} to toggle.", keybindingLabel)
					: localize('lightweightMode.tooltip', "Lightweight Editor Mode is active. Click to toggle.");
				const helpText = localize('lightweightMode.tooltipHelp', "Right-click for help and settings");
				tooltipText = `${baseTooltip}\n${helpText}`;
			}

			if (!this.entryAccessor) {
				// Show indicator when lightweight mode is active and status bar is visible
				this.entryAccessor = this.statusbarService.addEntry(
					{
						name: localize('lightweightMode', "Lightweight Mode"),
						text,
						tooltip: tooltipText,
						command: activeProfile ? 'workbench.action.selectLightweightModeProfile' : 'workbench.action.toggleLightweightMode',
						ariaLabel: activeProfile
							? localize('lightweightMode.ariaWithProfile', "Lightweight Mode: {0}", activeProfile.name)
							: localize('lightweightMode.aria', "Lightweight Mode Active")
					},
					this.statusBarEntry,
					StatusbarAlignment.RIGHT,
					100
				);
			} else {
				// Update existing entry
				this.entryAccessor.update({
					name: localize('lightweightMode', "Lightweight Mode"),
					text,
					tooltip: tooltipText,
					command: activeProfile ? 'workbench.action.selectLightweightModeProfile' : 'workbench.action.toggleLightweightMode',
					ariaLabel: activeProfile
						? localize('lightweightMode.ariaWithProfile', "Lightweight Mode: {0}", activeProfile.name)
						: localize('lightweightMode.aria', "Lightweight Mode Active")
				});
			}
		} else {
			// Remove indicator when lightweight mode is inactive or status bar is hidden
			this.entryAccessor?.dispose();
			this.entryAccessor = undefined;
		}
	}

	private hasShownFirstToggleNotification(): boolean {
		return this.storageService.getBoolean(this.firstToggleKey, StorageScope.APPLICATION, false);
	}

	private markFirstToggleNotificationShown(): void {
		this.storageService.store(this.firstToggleKey, true, StorageScope.APPLICATION, StorageTarget.USER);
	}

	private showFirstToggleNotification(): void {
		// Show a transient notification on first toggle to help users discover the feature
		const keybinding = this.keybindingService.lookupKeybinding('workbench.action.toggleLightweightMode');
		const keybindingLabel = keybinding?.getLabel();

		const message = keybindingLabel
			? localize(
				'lightweightMode.firstToggleWithShortcut',
				"Lightweight Mode activated! UI elements are simplified for a focused coding experience. Toggle anytime with {0}.",
				keybindingLabel
			)
			: localize(
				'lightweightMode.firstToggle',
				"Lightweight Mode activated! UI elements are simplified for a focused coding experience."
			);

		this.notificationService.info(message);
	}
}
