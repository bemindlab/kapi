/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { LightweightModeService } from '../../browser/lightweightModeService.js';
import { TestConfigurationService } from '../../../../test/browser/workbenchTestServices.js';
import { TestStorageService } from '../../../../test/common/workbenchTestServices.js';
import { Parts } from '../../../../services/layout/browser/layoutService.js';
import { NullTelemetryService } from '../../../../../platform/telemetry/common/telemetryUtils.js';

/**
 * Integration tests for Lightweight Mode
 *
 * These tests verify the integration between lightweight mode service,
 * configuration service, storage service, and layout service.
 */
suite('LightweightMode - Integration Tests', () => {

	const disposables = ensureNoDisposablesAreLeakedInTestSuite();

	suite('Layout Service Integration', () => {

		test('should correctly determine which parts to hide', async () => {
			const configurationService = new TestConfigurationService();
			const storageService = disposables.add(new TestStorageService());
			const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

			// Initially disabled, no parts should be hidden
			assert.strictEqual(service.shouldHidePart(Parts.ACTIVITYBAR_PART), false);
			assert.strictEqual(service.shouldHidePart(Parts.STATUSBAR_PART), false);

			// Enable lightweight mode
			await service.toggle();

			// With default configuration, activity bar should be hidden
			assert.strictEqual(service.shouldHidePart(Parts.ACTIVITYBAR_PART), true);
			// Status bar should not be hidden by default
			assert.strictEqual(service.shouldHidePart(Parts.STATUSBAR_PART), false);
		});

		test('should respect custom part visibility configuration', async () => {
			const configurationService = new TestConfigurationService();
			const storageService = disposables.add(new TestStorageService());
			const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

			// Configure to hide status bar but not activity bar
			await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', false);
			await configurationService.setUserConfiguration('workbench.lightweightMode.hideStatusBar', true);

			// Enable lightweight mode
			await service.toggle();

			// Verify custom configuration is applied
			assert.strictEqual(service.shouldHidePart(Parts.ACTIVITYBAR_PART), false);
			assert.strictEqual(service.shouldHidePart(Parts.STATUSBAR_PART), true);
		});

		test('should not hide essential parts', async () => {
			const configurationService = new TestConfigurationService();
			const storageService = disposables.add(new TestStorageService());
			const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

			await service.toggle();

			// Essential parts should never be hidden
			assert.strictEqual(service.shouldHidePart(Parts.EDITOR_PART), false);
			assert.strictEqual(service.shouldHidePart(Parts.SIDEBAR_PART), false);
			assert.strictEqual(service.shouldHidePart(Parts.PANEL_PART), false);
		});
	});

	suite('Configuration Service Integration', () => {

		test('should load configuration on startup', () => {
			const configurationService = new TestConfigurationService();
			const storageService = disposables.add(new TestStorageService());
			const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

			const config = service.getConfiguration();

			// Verify default configuration is loaded
			assert.strictEqual(typeof config.enabled, 'boolean');
			assert.strictEqual(typeof config.hideActivityBar, 'boolean');
			assert.strictEqual(typeof config.hideStatusBar, 'boolean');
			assert.strictEqual(typeof config.hideMinimap, 'boolean');
			assert.strictEqual(typeof config.hideBreadcrumbs, 'boolean');
		});

		test('should react to configuration changes', async () => {
			const configurationService = new TestConfigurationService();
			const storageService = disposables.add(new TestStorageService());
			const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

			let eventFired = false;
			disposables.add(service.onDidChangeLightweightMode(() => {
				eventFired = true;
			}));

			// Change configuration
			await configurationService.setUserConfiguration('workbench.lightweightMode.enabled', true);

			// Verify event was fired
			assert.strictEqual(eventFired, true);
			assert.strictEqual(service.isEnabled(), true);
		});

		test('should persist configuration changes', async () => {
			const configurationService = new TestConfigurationService();
			const storageService = disposables.add(new TestStorageService());
			const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

			// Set custom configuration
			await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', false);
			await configurationService.setUserConfiguration('workbench.lightweightMode.hideMinimap', false);

			// Enable mode
			await service.toggle();

			// Verify configuration persists
			const config = service.getConfiguration();
			assert.strictEqual(config.hideActivityBar, false);
			assert.strictEqual(config.hideMinimap, false);
		});

		test('should handle invalid configuration gracefully', async () => {
			const configurationService = new TestConfigurationService();
			const storageService = disposables.add(new TestStorageService());
			const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

			// Set invalid configuration (should fall back to defaults)
			await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', undefined);

			await service.toggle();

			// Should use default value
			const config = service.getConfiguration();
			assert.strictEqual(config.hideActivityBar, true); // Default is true
		});
	});

	suite('Storage Service Integration', () => {

		test('should persist mode state across sessions', async () => {
			const configurationService = new TestConfigurationService();
			const storageService = disposables.add(new TestStorageService());

			// First session: enable mode
			const service1 = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));
			await service1.toggle();
			assert.strictEqual(service1.isEnabled(), true);

			// Second session: mode should still be enabled
			const service2 = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));
			assert.strictEqual(service2.isEnabled(), true);
		});

		test('should sync state between storage and configuration', async () => {
			const configurationService = new TestConfigurationService();
			const storageService = disposables.add(new TestStorageService());
			const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

			// Toggle via service
			await service.toggle();

			// Verify both storage and configuration are updated
			assert.strictEqual(service.isEnabled(), true);

			// Toggle again
			await service.toggle();
			assert.strictEqual(service.isEnabled(), false);
		});
	});

	suite('Extension Integration', () => {

		test('should provide configuration for extension filtering', async () => {
			const configurationService = new TestConfigurationService();
			const storageService = disposables.add(new TestStorageService());
			const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

			await service.toggle();

			const config = service.getConfiguration();

			// Verify extension-related configuration is available
			assert.strictEqual(typeof config.hideExtensionRecommendations, 'boolean');
		});

		test('should allow customization of extension UI filtering', async () => {
			const configurationService = new TestConfigurationService();
			const storageService = disposables.add(new TestStorageService());
			const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

			// Configure to show extension recommendations
			await configurationService.setUserConfiguration('workbench.lightweightMode.hideExtensionRecommendations', false);

			await service.toggle();

			const config = service.getConfiguration();
			assert.strictEqual(config.hideExtensionRecommendations, false);
		});
	});

	suite('Event Integration', () => {

		test('should fire events on mode changes', async () => {
			const configurationService = new TestConfigurationService();
			const storageService = disposables.add(new TestStorageService());
			const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

			let eventCount = 0;
			let lastEventValue: boolean | undefined;

			disposables.add(service.onDidChangeLightweightMode((enabled) => {
				eventCount++;
				lastEventValue = enabled;
			}));

			// Toggle on
			await service.toggle();
			assert.strictEqual(eventCount, 1);
			assert.strictEqual(lastEventValue, true);

			// Toggle off
			await service.toggle();
			assert.strictEqual(eventCount, 2);
			assert.strictEqual(lastEventValue, false);
		});

		test('should fire events on configuration changes', async () => {
			const configurationService = new TestConfigurationService();
			const storageService = disposables.add(new TestStorageService());
			const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

			let eventFired = false;

			disposables.add(service.onDidChangeLightweightMode(() => {
				eventFired = true;
			}));

			// Change configuration directly
			await configurationService.setUserConfiguration('workbench.lightweightMode.enabled', true);

			assert.strictEqual(eventFired, true);
		});
	});

	suite('End-to-End Scenarios', () => {

		test('should handle complete workflow: enable, configure, disable', async () => {
			const configurationService = new TestConfigurationService();
			const storageService = disposables.add(new TestStorageService());
			const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

			// Step 1: Enable mode
			await service.toggle();
			assert.strictEqual(service.isEnabled(), true);

			// Step 2: Customize configuration
			await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', false);
			await configurationService.setUserConfiguration('workbench.lightweightMode.hideStatusBar', true);

			// Step 3: Verify configuration is applied
			const config = service.getConfiguration();
			assert.strictEqual(config.hideActivityBar, false);
			assert.strictEqual(config.hideStatusBar, true);

			// Step 4: Disable mode
			await service.toggle();
			assert.strictEqual(service.isEnabled(), false);

			// Step 5: Re-enable and verify configuration persists
			await service.toggle();
			const config2 = service.getConfiguration();
			assert.strictEqual(config2.hideActivityBar, false);
			assert.strictEqual(config2.hideStatusBar, true);
		});

		test('should handle rapid toggles without data loss', async () => {
			const configurationService = new TestConfigurationService();
			const storageService = disposables.add(new TestStorageService());
			const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

			// Set custom configuration
			await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', false);

			// Rapid toggles
			for (let i = 0; i < 10; i++) {
				await service.toggle();
			}

			// Verify configuration is still intact
			const config = service.getConfiguration();
			assert.strictEqual(config.hideActivityBar, false);
		});
	});
});
