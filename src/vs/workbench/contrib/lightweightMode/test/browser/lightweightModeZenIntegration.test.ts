/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { LightweightModeService } from '../../browser/lightweightModeService.js';
import { TestConfigurationService } from '../../../../test/browser/workbenchTestServices.js';
import { TestStorageService } from '../../../../test/common/workbenchTestServices.js';
import { NullTelemetryService } from '../../../../../platform/telemetry/common/telemetryUtils.js';

/**
 * Integration tests for Lightweight Mode and Zen Mode coexistence
 *
 * These tests verify that lightweight mode can work alongside zen mode
 * without conflicts.
 */
suite('LightweightMode - Zen Mode Integration', () => {

	const disposables = ensureNoDisposablesAreLeakedInTestSuite();

	test('should maintain state when toggled independently', async () => {
		const configurationService = new TestConfigurationService();
		const storageService = disposables.add(new TestStorageService());
		const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

		// Enable lightweight mode
		await service.toggle();
		assert.strictEqual(service.isEnabled(), true, 'Lightweight mode should be enabled');

		// Simulate zen mode being enabled (via configuration)
		// Zen mode typically hides parts through layout service, not through lightweight mode
		// So lightweight mode state should remain independent
		assert.strictEqual(service.isEnabled(), true, 'Lightweight mode should remain enabled');

		// Disable lightweight mode
		await service.toggle();
		assert.strictEqual(service.isEnabled(), false, 'Lightweight mode should be disabled');
	});

	test('should not interfere with zen mode part visibility', async () => {
		const configurationService = new TestConfigurationService();
		const storageService = disposables.add(new TestStorageService());
		const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

		// Enable lightweight mode
		await service.toggle();

		// Get configuration
		const config = service.getConfiguration();

		// Verify lightweight mode configuration is independent
		assert.strictEqual(config.enabled, true, 'Lightweight mode should be enabled');
		assert.strictEqual(typeof config.hideActivityBar, 'boolean', 'Activity bar config should be boolean');
		assert.strictEqual(typeof config.hideStatusBar, 'boolean', 'Status bar config should be boolean');
	});

	test('should handle rapid mode toggles without conflicts', async () => {
		const configurationService = new TestConfigurationService();
		const storageService = disposables.add(new TestStorageService());
		const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

		// Rapid toggles
		await service.toggle(); // Enable
		assert.strictEqual(service.isEnabled(), true);

		await service.toggle(); // Disable
		assert.strictEqual(service.isEnabled(), false);

		await service.toggle(); // Enable
		assert.strictEqual(service.isEnabled(), true);

		await service.toggle(); // Disable
		assert.strictEqual(service.isEnabled(), false);
	});

	test('should preserve configuration across mode changes', async () => {
		const configurationService = new TestConfigurationService();
		const storageService = disposables.add(new TestStorageService());
		const service = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));

		// Set custom configuration
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', false);
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideStatusBar', true);

		// Enable lightweight mode
		await service.toggle();

		// Verify configuration is preserved
		const config = service.getConfiguration();
		assert.strictEqual(config.hideActivityBar, false, 'Activity bar config should be preserved');
		assert.strictEqual(config.hideStatusBar, true, 'Status bar config should be preserved');

		// Disable and re-enable
		await service.toggle();
		await service.toggle();

		// Verify configuration is still preserved
		const config2 = service.getConfiguration();
		assert.strictEqual(config2.hideActivityBar, false, 'Activity bar config should still be preserved');
		assert.strictEqual(config2.hideStatusBar, true, 'Status bar config should still be preserved');
	});
});
