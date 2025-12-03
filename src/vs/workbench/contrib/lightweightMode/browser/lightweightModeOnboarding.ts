/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { INotificationService, Severity } from '../../../../platform/notification/common/notification.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { localize } from '../../../../nls.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { ILifecycleService, LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';

/**
 * Contribution that handles first-install onboarding for Lightweight Mode.
 * Shows a welcome notification on first launch and offers to start the walkthrough.
 */
export class LightweightModeOnboardingContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.lightweightModeOnboarding';

	private static readonly FIRST_INSTALL_KEY = 'workbench.lightweightMode.onboarding.firstInstallShown';
	private static readonly ONBOARDING_ENABLED_KEY = 'workbench.lightweightMode.onboarding.enabled';

	constructor(
		@IStorageService private readonly storageService: IStorageService,
		@INotificationService private readonly notificationService: INotificationService,
		@ICommandService private readonly commandService: ICommandService,
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@ILifecycleService private readonly lifecycleService: ILifecycleService
	) {
		super();

		// Wait for workbench to be fully restored before showing notifications
		this.lifecycleService.when(LifecyclePhase.Restored).then(() => {
			this.checkAndShowFirstInstallNotification();
		});
	}

	private checkAndShowFirstInstallNotification(): void {
		// Check if onboarding is enabled via configuration
		const onboardingEnabled = this.configurationService.getValue<boolean>(
			LightweightModeOnboardingContribution.ONBOARDING_ENABLED_KEY
		) ?? true; // Default to enabled

		if (!onboardingEnabled) {
			return;
		}

		// Check if we've already shown the first-install notification
		const hasShownFirstInstall = this.storageService.getBoolean(
			LightweightModeOnboardingContribution.FIRST_INSTALL_KEY,
			StorageScope.APPLICATION,
			false
		);

		if (hasShownFirstInstall) {
			return; // Already shown, nothing to do
		}

		// Show the welcome notification
		this.showWelcomeNotification();

		// Mark as shown
		this.markFirstInstallShown();
	}

	private showWelcomeNotification(): void {
		const message = localize(
			'lightweightMode.welcome.message',
			"Welcome to Lightweight Mode! Simplify your editor for a focused coding experience."
		);

		const startWalkthroughLabel = localize(
			'lightweightMode.welcome.startWalkthrough',
			"Take a Tour"
		);

		const dismissLabel = localize(
			'lightweightMode.welcome.dismiss',
			"Dismiss"
		);

		const learnMoreLabel = localize(
			'lightweightMode.welcome.learnMore',
			"Learn More"
		);

		this.notificationService.prompt(
			Severity.Info,
			message,
			[
				{
					label: startWalkthroughLabel,
					run: () => {
						// Open the lightweight mode walkthrough
						this.commandService.executeCommand(
							'workbench.action.openWalkthrough',
							'lightweightMode.walkthrough'
						);
					}
				},
				{
					label: learnMoreLabel,
					run: () => {
						// Open documentation or settings
						this.commandService.executeCommand(
							'workbench.action.openSettings',
							'@id:workbench.lightweightMode'
						);
					}
				},
				{
					label: dismissLabel,
					run: () => {
						// Just dismiss the notification
					}
				}
			],
			{
				sticky: false,
				priority: 1 // Lower priority so it doesn't interrupt critical notifications
			}
		);
	}

	private markFirstInstallShown(): void {
		this.storageService.store(
			LightweightModeOnboardingContribution.FIRST_INSTALL_KEY,
			true,
			StorageScope.APPLICATION,
			StorageTarget.MACHINE
		);
	}

	/**
	 * Public method to reset the first-install flag (useful for testing or re-onboarding).
	 */
	public resetFirstInstall(): void {
		this.storageService.remove(
			LightweightModeOnboardingContribution.FIRST_INSTALL_KEY,
			StorageScope.APPLICATION
		);
	}
}
