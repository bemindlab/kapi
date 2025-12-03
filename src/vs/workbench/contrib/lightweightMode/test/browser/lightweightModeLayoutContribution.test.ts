/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { LightweightModeLayoutContribution } from '../../browser/lightweightModeLayoutContribution.js';
import { LightweightModeService } from '../../browser/lightweightModeService.js';
import { TestConfigurationService } from '../../../../test/browser/workbenchTestServices.js';
import { TestStorageService } from '../../../../test/common/workbenchTestServices.js';
import { Parts } from '../../../../services/layout/browser/layoutService.js';
import { NullTelemetryService } from '../../../../../platform/telemetry/common/telemetryUtils.js';
class MockLayoutService {
	private hiddenParts: { [key: string]: boolean } = {};

	isVisible(part: Parts): boolean {
		return !this.hiddenParts[part];
	}

	setPartHidden(hidden: boolean, part: Parts): void {
		this.hiddenParts[part] = hidden;
	}

	getContainer(window: Window, part: Parts): HTMLElement | undefined {
		// Return undefined - animation controller will fall back to immediate mode
		return undefined;
	}

	getHiddenParts(): { [key: string]: boolean } {
		return this.hiddenParts;
	}
}

suite('LightweightModeLayoutContribution', () => {

	const disposables = ensureNoDisposablesAreLeakedInTestSuite();

	let configurationService: TestConfigurationService;
	let storageService: TestStorageService;
	let lightweightModeService: LightweightModeService;
	let layoutService: MockLayoutService;
	setup(() => {
		configurationService = new TestConfigurationService();
		storageService = disposables.add(new TestStorageService());
		lightweightModeService = disposables.add(new LightweightModeService(configurationService, storageService, NullTelemetryService));
		layoutService = new MockLayoutService();
		disposables.add(new LightweightModeLayoutContribution(
			lightweightModeService,
			layoutService as any,
			configurationService
		));
	});

	test('should not hide parts when mode is disabled', () => {
		const hiddenParts = layoutService.getHiddenParts();
		assert.strictEqual(hiddenParts[Parts.ACTIVITYBAR_PART], undefined);
		assert.strictEqual(hiddenParts[Parts.STATUSBAR_PART], undefined);
	});

	test('should hide activity bar when mode is enabled', async () => {
		// Configure to hide activity bar
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', true);

		// Enable mode
		await lightweightModeService.toggle();

		const hiddenParts = layoutService.getHiddenParts();
		assert.strictEqual(hiddenParts[Parts.ACTIVITYBAR_PART], true);
	});

	test('should hide status bar when configured', async () => {
		// Configure to hide status bar
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideStatusBar', true);

		// Enable mode
		await lightweightModeService.toggle();

		const hiddenParts = layoutService.getHiddenParts();
		assert.strictEqual(hiddenParts[Parts.STATUSBAR_PART], true);
	});

	test('should restore parts when mode is disabled', async () => {
		// Configure to hide activity bar
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', true);

		// Enable mode
		await lightweightModeService.toggle();

		// Verify hidden
		assert.strictEqual(layoutService.getHiddenParts()[Parts.ACTIVITYBAR_PART], true);

		// Disable mode
		await lightweightModeService.toggle();

		// Verify restored
		assert.strictEqual(layoutService.getHiddenParts()[Parts.ACTIVITYBAR_PART], false);
	});
});
