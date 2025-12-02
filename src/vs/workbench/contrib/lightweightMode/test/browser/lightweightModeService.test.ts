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

suite('LightweightModeService', () => {

	const disposables = ensureNoDisposablesAreLeakedInTestSuite();

	let configurationService: TestConfigurationService;
	let storageService: TestStorageService;
	let service: LightweightModeService;

	setup(() => {
		configurationService = new TestConfigurationService();
		storageService = new TestStorageService();
		service = disposables.add(new LightweightModeService(configurationService, storageService));
	});

	test('should start disabled by default', () => {
		assert.strictEqual(service.isEnabled(), false);
	});

	test('should enable when configuration is set', async () => {
		await configurationService.setUserConfiguration('workbench.lightweightMode.enabled', true);
		assert.strictEqual(service.isEnabled(), true);
	});

	test('should emit event when mode changes', async () => {
		let eventFired = false;
		let eventValue = false;

		disposables.add(service.onDidChangeLightweightMode((enabled: boolean) => {
			eventFired = true;
			eventValue = enabled;
		}));

		await configurationService.setUserConfiguration('workbench.lightweightMode.enabled', true);

		assert.strictEqual(eventFired, true);
		assert.strictEqual(eventValue, true);
	});

	test('should toggle mode', async () => {
		assert.strictEqual(service.isEnabled(), false);

		await service.toggle();
		assert.strictEqual(service.isEnabled(), true);

		await service.toggle();
		assert.strictEqual(service.isEnabled(), false);
	});

	test('should return configuration with defaults', () => {
		const config = service.getConfiguration();

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

	test('should respect custom configuration', async () => {
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', false);
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideStatusBar', true);

		const config = service.getConfiguration();

		assert.strictEqual(config.hideActivityBar, false);
		assert.strictEqual(config.hideStatusBar, true);
	});

	test('shouldHidePart returns false when disabled', () => {
		assert.strictEqual(service.shouldHidePart(Parts.ACTIVITYBAR_PART), false);
		assert.strictEqual(service.shouldHidePart(Parts.STATUSBAR_PART), false);
	});

	test('shouldHidePart returns true for activity bar when enabled and configured', async () => {
		await configurationService.setUserConfiguration('workbench.lightweightMode.enabled', true);
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', true);

		assert.strictEqual(service.shouldHidePart(Parts.ACTIVITYBAR_PART), true);
	});

	test('shouldHidePart returns false for activity bar when enabled but not configured', async () => {
		await configurationService.setUserConfiguration('workbench.lightweightMode.enabled', true);
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', false);

		assert.strictEqual(service.shouldHidePart(Parts.ACTIVITYBAR_PART), false);
	});

	test('shouldHidePart returns true for status bar when enabled and configured', async () => {
		await configurationService.setUserConfiguration('workbench.lightweightMode.enabled', true);
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideStatusBar', true);

		assert.strictEqual(service.shouldHidePart(Parts.STATUSBAR_PART), true);
	});

	test('shouldHideMenuItem returns false (not yet implemented)', () => {
		assert.strictEqual(service.shouldHideMenuItem('menu', 'item'), false);
	});
});
