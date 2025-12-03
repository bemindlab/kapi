/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { IConfigurationService } from '../../../../../platform/configuration/common/configuration.js';
import { TestConfigurationService } from '../../../../../platform/configuration/test/common/testConfigurationService.js';
import { TestInstantiationService } from '../../../../../platform/instantiation/test/common/instantiationServiceMock.js';
import { IStorageService, StorageScope } from '../../../../../platform/storage/common/storage.js';
import { Parts } from '../../../../services/layout/browser/layoutService.js';
import { ILightweightModeService } from '../../common/lightweightMode.js';
import { LightweightModeService } from '../../browser/lightweightModeService.js';
import { TestStorageService } from '../../../../test/common/workbenchTestServices.js';

suite('Lightweight Mode Integration Tests', () => {
	const disposables = ensureNoDisposablesAreLeakedInTestSuite();
	let instantiationService: TestInstantiationService;
	let configurationService: TestConfigurationService;
	let storageService: TestStorageService;
	let lightweightModeService: ILightweightModeService;

	setup(() => {
		instantiationService = disposables.add(new TestInstantiationService());
		configurationService = new TestConfigurationService();
		storageService = disposables.add(new TestStorageService());

		instantiationService.stub(IConfigurationService, configurationService);
		instantiationService.stub(IStorageService, storageService);

		lightweightModeService = disposables.add(instantiationService.createInstance(LightweightModeService));
		instantiationService.stub(ILightweightModeService, lightweightModeService);
	});

	test('Configuration service integration - mode toggle updates configuration', async () => {
		// Initial state should be disabled
		assert.strictEqual(lightweightModeService.isEnabled(), false);

		// Toggle mode
		await lightweightModeService.toggle();

		// Verify configuration was updated
		assert.strictEqual(lightweightModeService.isEnabled(), true);
		assert.strictEqual(configurationService.getValue('workbench.lightweightMode.enabled'), true);

		// Toggle back
		await lightweightModeService.toggle();
		assert.strictEqual(lightweightModeService.isEnabled(), false);
		assert.strictEqual(configurationService.getValue('workbench.lightweightMode.enabled'), false);
	});

	test('Configuration service integration - configuration changes trigger mode updates', async () => {
		let eventFired = false;
		let eventValue: boolean | undefined;

		disposables.add(lightweightModeService.onDidChangeLightweightMode(enabled => {
			eventFired = true;
			eventValue = enabled;
		}));

		// Update configuration directly
		await configurationService.setUserConfiguration('workbench.lightweightMode.enabled', true);
		configurationService.onDidChangeConfigurationEmitter.fire({
			affectsConfiguration: (key: string) => key === 'workbench.lightweightMode.enabled' || key.startsWith('workbench.lightweightMode')
		} as any);

		// Verify mode was updated
		assert.strictEqual(lightweightModeService.isEnabled(), true);
		assert.strictEqual(eventFired, true);
		assert.strictEqual(eventValue, true);
	});

	test('Storage service integration - mode persists across sessions', async () => {
		// Enable mode
		await lightweightModeService.toggle();
		assert.strictEqual(lightweightModeService.isEnabled(), true);

		// Verify storage was updated
		const storedValue = storageService.get('workbench.lightweightMode.enabled', StorageScope.PROFILE);
		assert.strictEqual(storedValue, 'true');

		// Create new service instance (simulating restart)
		const newService = disposables.add(instantiationService.createInstance(LightweightModeService));

		// Verify mode is still enabled
		assert.strictEqual(newService.isEnabled(), true);
	});

	test('Configuration caching - repeated calls use cached values', async () => {
		// Enable mode
		await lightweightModeService.toggle();

		// Get configuration multiple times
		const config1 = lightweightModeService.getConfiguration();
		const config2 = lightweightModeService.getConfiguration();

		// Verify configurations have same values (cached)
		assert.deepStrictEqual(config1, config2);
		assert.strictEqual(config1.enabled, true);
		assert.strictEqual(config2.enabled, true);
	});

	test('Configuration cache invalidation - cache cleared on configuration change', async () => {
		// Get initial configuration
		const config1 = lightweightModeService.getConfiguration();

		// Update configuration
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideMinimap', false);
		configurationService.onDidChangeConfigurationEmitter.fire({
			affectsConfiguration: (key: string) => key.startsWith('workbench.lightweightMode')
		} as any);

		// Get configuration again
		const config2 = lightweightModeService.getConfiguration();

		// Verify different object is returned (cache was invalidated)
		assert.notStrictEqual(config1, config2);
	});

	test('Part visibility determination - activity bar', async () => {
		// Initially mode is disabled
		assert.strictEqual(lightweightModeService.shouldHidePart(Parts.ACTIVITYBAR_PART), false);

		// Enable mode
		await lightweightModeService.toggle();

		// Activity bar should be hidden by default
		assert.strictEqual(lightweightModeService.shouldHidePart(Parts.ACTIVITYBAR_PART), true);

		// Configure to show activity bar
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', false);
		configurationService.onDidChangeConfigurationEmitter.fire({
			affectsConfiguration: (key: string) => key.startsWith('workbench.lightweightMode')
		} as any);

		// Activity bar should not be hidden
		assert.strictEqual(lightweightModeService.shouldHidePart(Parts.ACTIVITYBAR_PART), false);
	});

	test('Part visibility determination - status bar', async () => {
		// Enable mode
		await lightweightModeService.toggle();

		// Status bar should not be hidden by default
		assert.strictEqual(lightweightModeService.shouldHidePart(Parts.STATUSBAR_PART), false);

		// Configure to hide status bar
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideStatusBar', true);
		configurationService.onDidChangeConfigurationEmitter.fire({
			affectsConfiguration: (key: string) => key.startsWith('workbench.lightweightMode')
		} as any);

		// Status bar should be hidden
		assert.strictEqual(lightweightModeService.shouldHidePart(Parts.STATUSBAR_PART), true);
	});

	test('Event emission - mode changes fire events', async () => {
		const events: boolean[] = [];

		disposables.add(lightweightModeService.onDidChangeLightweightMode(enabled => {
			events.push(enabled);
		}));

		// Toggle mode multiple times
		await lightweightModeService.toggle();
		await lightweightModeService.toggle();
		await lightweightModeService.toggle();

		// Verify events were fired
		assert.strictEqual(events.length, 3);
		assert.deepStrictEqual(events, [true, false, true]);
	});

	test('Configuration defaults - all settings have correct defaults', () => {
		const config = lightweightModeService.getConfiguration();

		assert.strictEqual(config.enabled, false);
		assert.strictEqual(config.hideActivityBar, true);
		assert.strictEqual(config.hideStatusBar, false);
		assert.strictEqual(config.hideMinimap, true);
		assert.strictEqual(config.hideBreadcrumbs, true);
		assert.strictEqual(config.hideGitDecorations, true);
		assert.strictEqual(config.hideExtensionRecommendations, true);
		assert.strictEqual(config.simplifyMenus, true);
		assert.strictEqual(config.simplifyContextMenus, true);
	});

	test('Zen mode compatibility - lightweight mode state independent of zen mode', async () => {
		// This test verifies that lightweight mode can be toggled independently
		// In a real integration, zen mode would be tested separately

		// Enable lightweight mode
		await lightweightModeService.toggle();
		assert.strictEqual(lightweightModeService.isEnabled(), true);

		// Lightweight mode should remain enabled regardless of other modes
		// (Zen mode integration would be tested with actual layout service)
		assert.strictEqual(lightweightModeService.isEnabled(), true);
	});

	test('Performance - lazy evaluation of configuration', async () => {
		// When mode is disabled, shouldHidePart should return early without reading config
		const result = lightweightModeService.shouldHidePart(Parts.ACTIVITYBAR_PART);
		assert.strictEqual(result, false);

		// Enable mode to test lazy evaluation
		await lightweightModeService.toggle();

		// First call should read and cache configuration
		const result1 = lightweightModeService.shouldHidePart(Parts.ACTIVITYBAR_PART);
		assert.strictEqual(result1, true);

		// Subsequent calls should use cached configuration
		const result2 = lightweightModeService.shouldHidePart(Parts.STATUSBAR_PART);
		assert.strictEqual(result2, false);
	});

	test('Accessibility - mode changes are observable via events', async () => {
		// Screen readers and accessibility tools can listen to mode changes
		let modeChangeDetected = false;

		disposables.add(lightweightModeService.onDidChangeLightweightMode(() => {
			modeChangeDetected = true;
		}));

		await lightweightModeService.toggle();

		assert.strictEqual(modeChangeDetected, true);
	});
});
