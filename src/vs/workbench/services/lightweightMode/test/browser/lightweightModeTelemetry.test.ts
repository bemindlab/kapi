/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { IConfigurationService } from '../../../../../platform/configuration/common/configuration.js';
import { TestConfigurationService } from '../../../../../platform/configuration/test/common/testConfigurationService.js';
import { TestInstantiationService } from '../../../../../platform/instantiation/test/common/instantiationServiceMock.js';
import { IStorageService } from '../../../../../platform/storage/common/storage.js';
import { ILightweightModeService } from '../../common/lightweightMode.js';
import { LightweightModeService } from '../../browser/lightweightModeService.js';
import { TestStorageService } from '../../../../test/common/workbenchTestServices.js';
import { ITelemetryService, TelemetryLevel } from '../../../../../platform/telemetry/common/telemetry.js';

interface TelemetryEvent {
	name: string;
	data: any;
}

class TestTelemetryService implements ITelemetryService {
	declare readonly _serviceBrand: undefined;
	readonly telemetryLevel = TelemetryLevel.USAGE;
	readonly sessionId = 'test-session-id';
	readonly machineId = 'test-machine-id';
	readonly sqmId = 'test-sqm-id';
	readonly devDeviceId = 'test-dev-device-id';
	readonly firstSessionDate = 'test-first-session-date';
	readonly sendErrorTelemetry = true;

	public events: TelemetryEvent[] = [];

	publicLog(): void { }
	publicLog2(eventName: string, data?: any): void {
		this.events.push({ name: eventName, data });
	}
	publicLogError(): void { }
	publicLogError2(): void { }
	setExperimentProperty(): void { }

	getEvents(eventName: string): TelemetryEvent[] {
		return this.events.filter(e => e.name === eventName);
	}

	clearEvents(): void {
		this.events = [];
	}
}

suite('Lightweight Mode Telemetry Tests', () => {
	const disposables = ensureNoDisposablesAreLeakedInTestSuite();
	let instantiationService: TestInstantiationService;
	let configurationService: TestConfigurationService;
	let storageService: TestStorageService;
	let telemetryService: TestTelemetryService;
	let lightweightModeService: ILightweightModeService;

	setup(() => {
		instantiationService = disposables.add(new TestInstantiationService());
		configurationService = new TestConfigurationService();
		storageService = disposables.add(new TestStorageService());
		telemetryService = new TestTelemetryService();

		instantiationService.stub(IConfigurationService, configurationService);
		instantiationService.stub(IStorageService, storageService);
		instantiationService.stub(ITelemetryService, telemetryService);

		lightweightModeService = disposables.add(instantiationService.createInstance(LightweightModeService));
		instantiationService.stub(ILightweightModeService, lightweightModeService);
	});

	test('Toggle event - tracks when mode is toggled', async () => {
		telemetryService.clearEvents();

		// Toggle mode on
		await lightweightModeService.toggle('test');

		// Verify toggle event was sent
		const toggleEvents = telemetryService.getEvents('lightweightMode/toggled');
		assert.strictEqual(toggleEvents.length, 1);
		assert.strictEqual(toggleEvents[0].data.enabled, true);
		assert.strictEqual(toggleEvents[0].data.from, 'test');
		assert.strictEqual(toggleEvents[0].data.sessionCount, 1);

		// Toggle mode off
		await lightweightModeService.toggle('command');

		// Verify second toggle event
		const allToggleEvents = telemetryService.getEvents('lightweightMode/toggled');
		assert.strictEqual(allToggleEvents.length, 2);
		assert.strictEqual(allToggleEvents[1].data.enabled, false);
		assert.strictEqual(allToggleEvents[1].data.from, 'command');
		assert.strictEqual(allToggleEvents[1].data.sessionCount, 2);
	});

	test('Session duration - tracks duration when mode is disabled', async () => {
		telemetryService.clearEvents();

		// Enable mode
		await lightweightModeService.toggle();
		assert.strictEqual(lightweightModeService.isEnabled(), true);

		// Wait a bit
		await new Promise(resolve => setTimeout(resolve, 50));

		// Disable mode
		await lightweightModeService.toggle();

		// Verify session duration event was sent
		const sessionEvents = telemetryService.getEvents('lightweightMode/sessionDuration');
		assert.strictEqual(sessionEvents.length, 1);
		assert.ok(sessionEvents[0].data.durationMs >= 50, 'Duration should be at least 50ms');
		assert.strictEqual(sessionEvents[0].data.toggleCount, 2);
		assert.strictEqual(sessionEvents[0].data.configChanges, 0);
	});

	test('Session duration - tracks on service disposal', async () => {
		telemetryService.clearEvents();

		// Enable mode
		await lightweightModeService.toggle();

		// Wait a bit
		await new Promise(resolve => setTimeout(resolve, 50));

		// Dispose service (simulating shutdown)
		(lightweightModeService as LightweightModeService).dispose();

		// Verify session duration event was sent
		const sessionEvents = telemetryService.getEvents('lightweightMode/sessionDuration');
		assert.strictEqual(sessionEvents.length, 1);
		assert.ok(sessionEvents[0].data.durationMs >= 50);
	});

	test('Configuration change - tracks when settings are changed', async () => {
		telemetryService.clearEvents();

		// Change a configuration setting
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', false);
		configurationService.onDidChangeConfigurationEmitter.fire({
			affectsConfiguration: (key: string) => key === 'workbench.lightweightMode.hideActivityBar',
			affectedKeys: new Set(['workbench.lightweightMode.hideActivityBar'])
		} as any);

		// Verify config change event was sent
		const configEvents = telemetryService.getEvents('lightweightMode/configChanged');
		assert.strictEqual(configEvents.length, 1);
		assert.strictEqual(configEvents[0].data.settingKey, 'hideActivityBar');
		assert.strictEqual(configEvents[0].data.newValue, 'boolean');
		assert.strictEqual(configEvents[0].data.isEnabled, false);
	});

	test('Configuration change - does not track enabled state changes', async () => {
		telemetryService.clearEvents();

		// Change the enabled state (this should not fire a config changed event)
		await configurationService.setUserConfiguration('workbench.lightweightMode.enabled', true);
		configurationService.onDidChangeConfigurationEmitter.fire({
			affectsConfiguration: (key: string) => key === 'workbench.lightweightMode.enabled',
			affectedKeys: new Set(['workbench.lightweightMode.enabled'])
		} as any);

		// Verify no config change event was sent (toggle event is handled separately)
		const configEvents = telemetryService.getEvents('lightweightMode/configChanged');
		assert.strictEqual(configEvents.length, 0);
	});

	test('Configuration change - tracks multiple settings', async () => {
		telemetryService.clearEvents();

		// Change multiple settings
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', false);
		configurationService.onDidChangeConfigurationEmitter.fire({
			affectsConfiguration: (key: string) => key.startsWith('workbench.lightweightMode'),
			affectedKeys: new Set(['workbench.lightweightMode.hideActivityBar'])
		} as any);

		await configurationService.setUserConfiguration('workbench.lightweightMode.hideMinimap', false);
		configurationService.onDidChangeConfigurationEmitter.fire({
			affectsConfiguration: (key: string) => key.startsWith('workbench.lightweightMode'),
			affectedKeys: new Set(['workbench.lightweightMode.hideMinimap'])
		} as any);

		// Verify both config change events were sent
		const configEvents = telemetryService.getEvents('lightweightMode/configChanged');
		assert.strictEqual(configEvents.length, 2);
		assert.strictEqual(configEvents[0].data.settingKey, 'hideActivityBar');
		assert.strictEqual(configEvents[1].data.settingKey, 'hideMinimap');
	});

	test('Configuration change - tracks array values', async () => {
		telemetryService.clearEvents();

		// Change an array setting
		await configurationService.setUserConfiguration('workbench.lightweightMode.menuFavorites', ['file.open', 'edit.undo']);
		configurationService.onDidChangeConfigurationEmitter.fire({
			affectsConfiguration: (key: string) => key === 'workbench.lightweightMode.menuFavorites',
			affectedKeys: new Set(['workbench.lightweightMode.menuFavorites'])
		} as any);

		// Verify config change event reports array type
		const configEvents = telemetryService.getEvents('lightweightMode/configChanged');
		assert.strictEqual(configEvents.length, 1);
		assert.strictEqual(configEvents[0].data.settingKey, 'menuFavorites');
		assert.strictEqual(configEvents[0].data.newValue, 'array');
	});

	test('First toggle - tracks time to first toggle', async () => {
		// Create a fresh service with new storage
		const newStorageService = disposables.add(new TestStorageService());
		const newTelemetryService = new TestTelemetryService();
		const newInstantiationService = disposables.add(new TestInstantiationService());

		newInstantiationService.stub(IConfigurationService, configurationService);
		newInstantiationService.stub(IStorageService, newStorageService);
		newInstantiationService.stub(ITelemetryService, newTelemetryService);

		const newService = disposables.add(newInstantiationService.createInstance(LightweightModeService));

		// Wait a bit to simulate time passing
		await new Promise(resolve => setTimeout(resolve, 50));

		// Toggle for the first time
		await newService.toggle();

		// Verify first toggle event was sent
		const firstToggleEvents = newTelemetryService.getEvents('lightweightMode/firstToggle');
		assert.strictEqual(firstToggleEvents.length, 1);
		assert.ok(firstToggleEvents[0].data.timeToFirstToggleMs >= 50);
		assert.strictEqual(firstToggleEvents[0].data.enabledOnFirstToggle, true);

		// Toggle again - should not send another first toggle event
		newTelemetryService.clearEvents();
		await newService.toggle();

		const noMoreFirstToggle = newTelemetryService.getEvents('lightweightMode/firstToggle');
		assert.strictEqual(noMoreFirstToggle.length, 0);
	});

	test('Session tracking - counts config changes during session', async () => {
		telemetryService.clearEvents();

		// Enable mode
		await lightweightModeService.toggle();

		// Change multiple settings
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', false);
		configurationService.onDidChangeConfigurationEmitter.fire({
			affectsConfiguration: (key: string) => key.startsWith('workbench.lightweightMode'),
			affectedKeys: new Set(['workbench.lightweightMode.hideActivityBar'])
		} as any);

		await configurationService.setUserConfiguration('workbench.lightweightMode.hideMinimap', false);
		configurationService.onDidChangeConfigurationEmitter.fire({
			affectsConfiguration: (key: string) => key.startsWith('workbench.lightweightMode'),
			affectedKeys: new Set(['workbench.lightweightMode.hideMinimap'])
		} as any);

		// Disable mode
		await lightweightModeService.toggle();

		// Verify session event tracks config changes
		const sessionEvents = telemetryService.getEvents('lightweightMode/sessionDuration');
		assert.strictEqual(sessionEvents.length, 1);
		assert.strictEqual(sessionEvents[0].data.configChanges, 2);
	});

	test('Toggle count - increments across multiple toggles', async () => {
		telemetryService.clearEvents();

		// Toggle multiple times
		await lightweightModeService.toggle();
		await lightweightModeService.toggle();
		await lightweightModeService.toggle();

		// Verify session counts increment
		const toggleEvents = telemetryService.getEvents('lightweightMode/toggled');
		assert.strictEqual(toggleEvents.length, 3);
		assert.strictEqual(toggleEvents[0].data.sessionCount, 1);
		assert.strictEqual(toggleEvents[1].data.sessionCount, 2);
		assert.strictEqual(toggleEvents[2].data.sessionCount, 3);
	});

	test('Privacy compliance - no PII in configuration tracking', async () => {
		telemetryService.clearEvents();

		// Change a setting with a value
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', false);
		configurationService.onDidChangeConfigurationEmitter.fire({
			affectsConfiguration: (key: string) => key === 'workbench.lightweightMode.hideActivityBar',
			affectedKeys: new Set(['workbench.lightweightMode.hideActivityBar'])
		} as any);

		// Verify only the type is tracked, not the value
		const configEvents = telemetryService.getEvents('lightweightMode/configChanged');
		assert.strictEqual(configEvents.length, 1);
		assert.strictEqual(configEvents[0].data.newValue, 'boolean');
		// The actual value 'false' should not be in the event
		assert.notStrictEqual(configEvents[0].data.newValue, false);
	});

	test('Session tracking - resets counters between sessions', async () => {
		telemetryService.clearEvents();

		// First session
		await lightweightModeService.toggle();
		await configurationService.setUserConfiguration('workbench.lightweightMode.hideActivityBar', false);
		configurationService.onDidChangeConfigurationEmitter.fire({
			affectsConfiguration: (key: string) => key.startsWith('workbench.lightweightMode'),
			affectedKeys: new Set(['workbench.lightweightMode.hideActivityBar'])
		} as any);
		await lightweightModeService.toggle();

		// Verify first session
		let sessionEvents = telemetryService.getEvents('lightweightMode/sessionDuration');
		assert.strictEqual(sessionEvents.length, 1);
		assert.strictEqual(sessionEvents[0].data.configChanges, 1);

		telemetryService.clearEvents();

		// Second session
		await lightweightModeService.toggle();
		await lightweightModeService.toggle();

		// Verify second session has reset config change counter
		sessionEvents = telemetryService.getEvents('lightweightMode/sessionDuration');
		assert.strictEqual(sessionEvents.length, 1);
		assert.strictEqual(sessionEvents[0].data.configChanges, 0);
	});
});
