/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { TestInstantiationService } from '../../../../../platform/instantiation/test/common/instantiationServiceMock.js';
import { LightweightModeProfileService } from '../../browser/lightweightModeProfileService.js';
import { ILightweightModeProfileService, BuiltInProfileId } from '../../common/lightweightModeProfiles.js';
import { ILightweightModeService, ILightweightModeConfiguration } from '../../common/lightweightMode.js';
import { IStorageService, InMemoryStorageService } from '../../../../../platform/storage/common/storage.js';
import { TestConfigurationService } from '../../../../../platform/configuration/test/common/testConfigurationService.js';
import { IConfigurationService } from '../../../../../platform/configuration/common/configuration.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';

class MockLightweightModeService implements ILightweightModeService {
	_serviceBrand: undefined;
	onDidChangeLightweightMode = () => ({ dispose: () => { } });
	isEnabled = () => true;
	toggle = async () => { };
	shouldHidePart = () => false;
	shouldHideMenuItem = () => false;
	hideActivityBar = false;
	hideStatusBar = false;
	hideMinimap = true;
	hideBreadcrumbs = true;
	hideGitDecorations = true;
	hideExtensionRecommendations = true;
	simplifyMenus = true;
	simplifyContextMenus = true;
	activityBarBehavior = 'hidden' as const;
	statusBarMode = 'visible' as const;
	editorFocusMode = false;
	menuFavorites = [] as string[];

	getConfiguration(): ILightweightModeConfiguration {
		return {
			enabled: true,
			hideActivityBar: this.hideActivityBar,
			hideStatusBar: this.hideStatusBar,
			hideMinimap: this.hideMinimap,
			hideBreadcrumbs: this.hideBreadcrumbs,
			hideGitDecorations: this.hideGitDecorations,
			hideExtensionRecommendations: this.hideExtensionRecommendations,
			simplifyMenus: this.simplifyMenus,
			simplifyContextMenus: this.simplifyContextMenus,
			customizations: {
				hiddenParts: [],
				hiddenMenuItems: [],
				hiddenContextMenuItems: []
			},
			activityBarBehavior: this.activityBarBehavior,
			statusBarMode: this.statusBarMode,
			editorFocusMode: this.editorFocusMode,
			menuFavorites: this.menuFavorites
		};
	}
}

suite('LightweightModeProfileService', () => {
	let instantiationService: TestInstantiationService;
	let profileService: ILightweightModeProfileService;
	let storageService: IStorageService;
	let configurationService: TestConfigurationService;
	let lightweightModeService: MockLightweightModeService;

	const disposables = ensureNoDisposablesAreLeakedInTestSuite();

	setup(() => {
		instantiationService = disposables.add(new TestInstantiationService());
		storageService = disposables.add(new InMemoryStorageService());
		configurationService = new TestConfigurationService();
		lightweightModeService = new MockLightweightModeService();

		instantiationService.stub(IStorageService, storageService);
		instantiationService.stub(IConfigurationService, configurationService);
		instantiationService.stub(ILightweightModeService, lightweightModeService);

		profileService = disposables.add(instantiationService.createInstance(LightweightModeProfileService));
	});

	test('should have built-in profiles', () => {
		const profiles = profileService.getBuiltInProfiles();
		assert.strictEqual(profiles.length, 4, 'Should have 4 built-in profiles');

		const profileIds = profiles.map(p => p.id);
		assert.ok(profileIds.includes(BuiltInProfileId.UltraMinimal), 'Should include Ultra Minimal profile');
		assert.ok(profileIds.includes(BuiltInProfileId.FocusedCoding), 'Should include Focused Coding profile');
		assert.ok(profileIds.includes(BuiltInProfileId.AIPairProgramming), 'Should include AI Pair Programming profile');
		assert.ok(profileIds.includes(BuiltInProfileId.PresentationMode), 'Should include Presentation Mode profile');

		// Verify all built-in profiles are marked as such
		profiles.forEach(profile => {
			assert.ok(profile.isBuiltIn, `Profile ${profile.name} should be marked as built-in`);
		});
	});

	test('should get profile by ID', () => {
		const profile = profileService.getProfile(BuiltInProfileId.UltraMinimal);
		assert.ok(profile, 'Should find Ultra Minimal profile');
		assert.strictEqual(profile!.id, BuiltInProfileId.UltraMinimal);
		assert.strictEqual(profile!.name, 'Ultra Minimal');
	});

	test('should return undefined for non-existent profile', () => {
		const profile = profileService.getProfile('non-existent-profile');
		assert.strictEqual(profile, undefined);
	});

	test('should start with no active profile', () => {
		const activeProfileId = profileService.getActiveProfileId();
		assert.strictEqual(activeProfileId, undefined);
	});

	test('should apply profile and update configuration', async () => {
		const configUpdates: Array<{ key: string; value: any }> = [];
		configurationService.onDidChangeConfiguration(() => { });
		const originalUpdate = configurationService.updateValue.bind(configurationService);
		configurationService.updateValue = async (key: string, value: any) => {
			configUpdates.push({ key, value });
			return originalUpdate(key, value);
		};

		await profileService.applyProfile(BuiltInProfileId.UltraMinimal);

		// Verify configuration updates were made
		assert.ok(configUpdates.length > 0, 'Should have updated configuration');
		assert.ok(configUpdates.some(u => u.key === 'workbench.lightweightMode.enabled'), 'Should update enabled');

		// Verify active profile is set
		const activeProfileId = profileService.getActiveProfileId();
		assert.strictEqual(activeProfileId, BuiltInProfileId.UltraMinimal);
	});

	test('should save current configuration as custom profile', async () => {
		const profileName = 'My Custom Profile';
		const profileDescription = 'My custom lightweight mode configuration';

		const profile = await profileService.saveCurrentAsProfile(profileName, profileDescription);

		assert.ok(profile, 'Should create profile');
		assert.strictEqual(profile.name, profileName);
		assert.strictEqual(profile.description, profileDescription);
		assert.strictEqual(profile.isBuiltIn, false);
		assert.ok(profile.id.startsWith('custom-'), 'Custom profile should have custom- prefix');
		assert.ok(profile.createdAt, 'Should have creation timestamp');

		// Verify profile is in custom profiles list
		const customProfiles = profileService.getCustomProfiles();
		assert.strictEqual(customProfiles.length, 1);
		assert.strictEqual(customProfiles[0].id, profile.id);
	});

	test('should reject invalid profile name', async () => {
		await assert.rejects(
			async () => await profileService.saveCurrentAsProfile('', 'Description'),
			/Profile name cannot be empty/
		);

		await assert.rejects(
			async () => await profileService.saveCurrentAsProfile('   ', 'Description'),
			/Profile name cannot be empty/
		);
	});

	test('should delete custom profile', async () => {
		const profile = await profileService.saveCurrentAsProfile('Test Profile', 'Test');

		const success = await profileService.deleteProfile(profile.id);
		assert.strictEqual(success, true);

		const customProfiles = profileService.getCustomProfiles();
		assert.strictEqual(customProfiles.length, 0);
	});

	test('should not delete built-in profile', async () => {
		const success = await profileService.deleteProfile(BuiltInProfileId.UltraMinimal);
		assert.strictEqual(success, false);

		// Verify profile still exists
		const profile = profileService.getProfile(BuiltInProfileId.UltraMinimal);
		assert.ok(profile);
	});

	test('should clear active profile when deleting active profile', async () => {
		const profile = await profileService.saveCurrentAsProfile('Test Profile', 'Test');
		await profileService.applyProfile(profile.id);

		assert.strictEqual(profileService.getActiveProfileId(), profile.id);

		await profileService.deleteProfile(profile.id);

		assert.strictEqual(profileService.getActiveProfileId(), undefined);
	});

	test('should export profile to JSON', () => {
		const json = profileService.exportProfile(BuiltInProfileId.UltraMinimal);
		assert.ok(json, 'Should export profile');

		const data = JSON.parse(json!);
		assert.ok(data.name, 'Should include name');
		assert.ok(data.description, 'Should include description');
		assert.ok(data.configuration, 'Should include configuration');
		assert.strictEqual(data.isBuiltIn, undefined, 'Should not include isBuiltIn flag');
	});

	test('should return undefined when exporting non-existent profile', () => {
		const json = profileService.exportProfile('non-existent');
		assert.strictEqual(json, undefined);
	});

	test('should import profile from JSON', async () => {
		const exportJson = profileService.exportProfile(BuiltInProfileId.FocusedCoding);
		assert.ok(exportJson);

		const imported = await profileService.importProfile(exportJson!);
		assert.ok(imported);
		assert.strictEqual(imported.name, 'Focused Coding');
		assert.strictEqual(imported.isBuiltIn, false, 'Imported profile should not be built-in');
		assert.ok(imported.id.startsWith('custom-'), 'Imported profile should have custom ID');

		// Verify it's in custom profiles
		const customProfiles = profileService.getCustomProfiles();
		assert.ok(customProfiles.some(p => p.id === imported.id));
	});

	test('should reject invalid JSON import', async () => {
		await assert.rejects(
			async () => await profileService.importProfile('invalid json'),
			/Failed to import profile/
		);
	});

	test('should reject import with missing required fields', async () => {
		const invalidProfile = JSON.stringify({ description: 'Test' });
		await assert.rejects(
			async () => await profileService.importProfile(invalidProfile),
			/missing required fields/
		);
	});

	test('should reject import with invalid configuration', async () => {
		const invalidProfile = JSON.stringify({
			name: 'Test',
			configuration: {
				enabled: 'not a boolean', // Invalid
				hideActivityBar: true
			}
		});
		await assert.rejects(
			async () => await profileService.importProfile(invalidProfile),
			/Failed to import profile/
		);
	});

	test('should clear active profile', async () => {
		await profileService.applyProfile(BuiltInProfileId.UltraMinimal);
		assert.strictEqual(profileService.getActiveProfileId(), BuiltInProfileId.UltraMinimal);

		await profileService.clearActiveProfile();
		assert.strictEqual(profileService.getActiveProfileId(), undefined);
	});

	test('should persist active profile across service instances', async () => {
		await profileService.applyProfile(BuiltInProfileId.FocusedCoding);

		// Create new service instance with same storage
		const newProfileService = disposables.add(instantiationService.createInstance(LightweightModeProfileService));

		assert.strictEqual(newProfileService.getActiveProfileId(), BuiltInProfileId.FocusedCoding);
	});

	test('should persist custom profiles across service instances', async () => {
		const profile = await profileService.saveCurrentAsProfile('Test Profile', 'Test Description');

		// Create new service instance with same storage
		const newProfileService = disposables.add(instantiationService.createInstance(LightweightModeProfileService));

		const customProfiles = newProfileService.getCustomProfiles();
		assert.strictEqual(customProfiles.length, 1);
		assert.strictEqual(customProfiles[0].name, profile.name);
		assert.strictEqual(customProfiles[0].description, profile.description);
	});

	test('should get all profiles (built-in + custom)', async () => {
		await profileService.saveCurrentAsProfile('Custom 1', 'Test 1');
		await profileService.saveCurrentAsProfile('Custom 2', 'Test 2');

		const allProfiles = profileService.getProfiles();
		assert.strictEqual(allProfiles.length, 6, 'Should have 4 built-in + 2 custom profiles');

		const builtInCount = allProfiles.filter(p => p.isBuiltIn).length;
		const customCount = allProfiles.filter(p => !p.isBuiltIn).length;

		assert.strictEqual(builtInCount, 4);
		assert.strictEqual(customCount, 2);
	});

	test('Ultra Minimal profile should hide all UI elements', () => {
		const profile = profileService.getProfile(BuiltInProfileId.UltraMinimal);
		assert.ok(profile);

		const config = profile!.configuration;
		assert.strictEqual(config.enabled, true);
		assert.strictEqual(config.hideActivityBar, true);
		assert.strictEqual(config.hideStatusBar, true);
		assert.strictEqual(config.hideMinimap, true);
		assert.strictEqual(config.hideBreadcrumbs, true);
		assert.strictEqual(config.editorFocusMode, true);
		assert.strictEqual(config.statusBarMode, 'hidden');
	});

	test('Focused Coding profile should balance productivity and minimalism', () => {
		const profile = profileService.getProfile(BuiltInProfileId.FocusedCoding);
		assert.ok(profile);

		const config = profile!.configuration;
		assert.strictEqual(config.enabled, true);
		assert.strictEqual(config.hideActivityBar, true);
		assert.strictEqual(config.hideStatusBar, false); // Keep status bar
		assert.strictEqual(config.hideBreadcrumbs, false); // Keep breadcrumbs
		assert.strictEqual(config.activityBarBehavior, 'auto'); // Auto-hide
		assert.strictEqual(config.statusBarMode, 'minimal');
	});

	test('AI Pair Programming profile should optimize for AI workflows', () => {
		const profile = profileService.getProfile(BuiltInProfileId.AIPairProgramming);
		assert.ok(profile);

		const config = profile!.configuration;
		assert.strictEqual(config.enabled, true);
		assert.strictEqual(config.hideGitDecorations, true);
		assert.strictEqual(config.hideExtensionRecommendations, true);
		assert.strictEqual(config.simplifyMenus, true);
		assert.strictEqual(config.hideStatusBar, false); // Keep status bar for info
	});

	test('Presentation Mode profile should be clean for demos', () => {
		const profile = profileService.getProfile(BuiltInProfileId.PresentationMode);
		assert.ok(profile);

		const config = profile!.configuration;
		assert.strictEqual(config.enabled, true);
		assert.strictEqual(config.hideActivityBar, true);
		assert.strictEqual(config.hideStatusBar, true);
		assert.strictEqual(config.hideBreadcrumbs, true);
		assert.strictEqual(config.statusBarMode, 'hidden');
	});

	test('should throw error when applying non-existent profile', async () => {
		await assert.rejects(
			async () => await profileService.applyProfile('non-existent'),
			/Profile not found/
		);
	});

	test('should emit event when active profile changes', async () => {
		let eventFired = false;
		let firedProfileId: string | undefined;

		disposables.add(profileService.onDidChangeActiveProfile(profileId => {
			eventFired = true;
			firedProfileId = profileId;
		}));

		await profileService.applyProfile(BuiltInProfileId.UltraMinimal);

		assert.strictEqual(eventFired, true);
		assert.strictEqual(firedProfileId, BuiltInProfileId.UltraMinimal);
	});

	test('should emit event when profiles list changes', async () => {
		let eventFired = false;

		disposables.add(profileService.onDidChangeProfiles(() => {
			eventFired = true;
		}));

		await profileService.saveCurrentAsProfile('Test', 'Test');

		assert.strictEqual(eventFired, true);
	});
});
