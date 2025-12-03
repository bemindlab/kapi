/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { TestInstantiationService } from '../../../../../platform/instantiation/test/common/instantiationServiceMock.js';
import { IStorageService, StorageScope } from '../../../../../platform/storage/common/storage.js';
import { INotificationService } from '../../../../../platform/notification/common/notification.js';
import { ICommandService } from '../../../../../platform/commands/common/commands.js';
import { IConfigurationService } from '../../../../../platform/configuration/common/configuration.js';
import { ILifecycleService, LifecyclePhase } from '../../../../services/lifecycle/common/lifecycle.js';
import { LightweightModeOnboardingContribution } from '../../browser/lightweightModeOnboarding.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { TestConfigurationService } from '../../../../../platform/configuration/test/common/testConfigurationService.js';
import { TestStorageService } from '../../../../test/common/workbenchTestServices.js';
import { TestNotificationService } from '../../../../../platform/notification/test/common/testNotificationService.js';
import { TestLifecycleService } from '../../../../test/browser/workbenchTestServices.js';

suite('LightweightMode - Onboarding', () => {
	const disposables = ensureNoDisposablesAreLeakedInTestSuite();

	let instantiationService: TestInstantiationService;
	let storageService: TestStorageService;
	let notificationService: TestNotificationService;
	let configurationService: TestConfigurationService;
	let lifecycleService: TestLifecycleService;

	setup(() => {
		instantiationService = disposables.add(new TestInstantiationService());
		storageService = disposables.add(new TestStorageService());
		notificationService = new TestNotificationService();
		configurationService = new TestConfigurationService();
		lifecycleService = new TestLifecycleService();

		instantiationService.stub(IStorageService, storageService);
		instantiationService.stub(INotificationService, notificationService);
		instantiationService.stub(IConfigurationService, configurationService);
		instantiationService.stub(ILifecycleService, lifecycleService);
		instantiationService.stub(ICommandService, {
			executeCommand: <T = unknown>(commandId: string, ...args: unknown[]) => Promise.resolve(undefined as T | undefined)
		});
	});

	test('should show first-install notification on first run', async () => {
		// Ensure first install flag is not set
		storageService.remove('workbench.lightweightMode.onboarding.firstInstallShown', StorageScope.APPLICATION);

		// Create contribution
		const contribution = instantiationService.createInstance(LightweightModeOnboardingContribution);
		disposables.add(contribution);

		// Wait for lifecycle phase
		await lifecycleService.when(LifecyclePhase.Restored);

		// Give some time for async operations
		await new Promise(resolve => setTimeout(resolve, 100));

		// Verify notification was shown (we can't directly check notifications in test, so we check the storage flag)

		// Verify storage flag was set
		const flag = storageService.getBoolean('workbench.lightweightMode.onboarding.firstInstallShown', StorageScope.APPLICATION, false);
		assert.strictEqual(flag, true, 'Should mark first install as shown');
	});

	test('should not show notification on subsequent runs', async () => {
		// Mark as already shown
		storageService.store('workbench.lightweightMode.onboarding.firstInstallShown', true, StorageScope.APPLICATION, 0);

		// Create contribution
		const contribution = instantiationService.createInstance(LightweightModeOnboardingContribution);
		disposables.add(contribution);

		// Wait for lifecycle phase
		await lifecycleService.when(LifecyclePhase.Restored);

		// Give some time for async operations
		await new Promise(resolve => setTimeout(resolve, 100));

		// Verify flag remains set (notification should not be shown again)
		const flag = storageService.getBoolean('workbench.lightweightMode.onboarding.firstInstallShown', StorageScope.APPLICATION, false);
		assert.strictEqual(flag, true, 'Flag should remain set on subsequent runs');
	});

	test('should respect onboarding.enabled configuration', async () => {
		// Ensure first install flag is not set
		storageService.remove('workbench.lightweightMode.onboarding.firstInstallShown', StorageScope.APPLICATION);

		// Disable onboarding
		configurationService.setUserConfiguration('workbench.lightweightMode.onboarding.enabled', false);

		// Create contribution
		const contribution = instantiationService.createInstance(LightweightModeOnboardingContribution);
		disposables.add(contribution);

		// Wait for lifecycle phase
		await lifecycleService.when(LifecyclePhase.Restored);

		// Give some time for async operations
		await new Promise(resolve => setTimeout(resolve, 100));

		// Verify flag was not set (notification was not shown due to disabled config)
		const flag = storageService.getBoolean('workbench.lightweightMode.onboarding.firstInstallShown', StorageScope.APPLICATION, false);
		assert.strictEqual(flag, false, 'Flag should not be set when onboarding is disabled');
	});

	test('should allow resetting first-install flag', () => {
		// Mark as already shown
		storageService.store('workbench.lightweightMode.onboarding.firstInstallShown', true, StorageScope.APPLICATION, 0);

		// Create contribution
		const contribution = instantiationService.createInstance(LightweightModeOnboardingContribution);
		disposables.add(contribution);

		// Verify flag is set
		let flag = storageService.getBoolean('workbench.lightweightMode.onboarding.firstInstallShown', StorageScope.APPLICATION, false);
		assert.strictEqual(flag, true, 'Flag should be set initially');

		// Reset the flag
		contribution.resetFirstInstall();

		// Verify flag is cleared
		flag = storageService.getBoolean('workbench.lightweightMode.onboarding.firstInstallShown', StorageScope.APPLICATION, false);
		assert.strictEqual(flag, false, 'Flag should be cleared after reset');
	});
});
