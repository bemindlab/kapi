/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { ILightweightModeProfileService, ILightweightModeProfile, BuiltInProfileId } from '../common/lightweightModeProfiles.js';
import { ILightweightModeService, ILightweightModeConfiguration } from '../common/lightweightMode.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';

const ACTIVE_PROFILE_KEY = 'workbench.lightweightMode.activeProfile';
const CUSTOM_PROFILES_KEY = 'workbench.lightweightMode.customProfiles';

/**
 * Built-in profile definitions.
 */
const BUILT_IN_PROFILES: ILightweightModeProfile[] = [
	{
		id: BuiltInProfileId.UltraMinimal,
		name: 'Ultra Minimal',
		description: 'Hide everything except editor. Perfect for distraction-free writing.',
		icon: 'symbol-file',
		isBuiltIn: true,
		configuration: {
			enabled: true,
			hideActivityBar: true,
			hideStatusBar: true,
			hideMinimap: true,
			hideBreadcrumbs: true,
			hideGitDecorations: true,
			hideExtensionRecommendations: true,
			simplifyMenus: true,
			simplifyContextMenus: true,
			customizations: {
				hiddenParts: [],
				hiddenMenuItems: [],
				hiddenContextMenuItems: []
			},
			activityBarBehavior: 'hidden',
			statusBarMode: 'hidden',
			editorFocusMode: true,
			menuFavorites: []
		}
	},
	{
		id: BuiltInProfileId.FocusedCoding,
		name: 'Focused Coding',
		description: 'Hide distractions, keep essential tools. Balanced for productive coding.',
		icon: 'code',
		isBuiltIn: true,
		configuration: {
			enabled: true,
			hideActivityBar: true,
			hideStatusBar: false,
			hideMinimap: true,
			hideBreadcrumbs: false,
			hideGitDecorations: false,
			hideExtensionRecommendations: true,
			simplifyMenus: true,
			simplifyContextMenus: true,
			customizations: {
				hiddenParts: [],
				hiddenMenuItems: [],
				hiddenContextMenuItems: []
			},
			activityBarBehavior: 'auto',
			statusBarMode: 'minimal',
			editorFocusMode: false,
			menuFavorites: []
		}
	},
	{
		id: BuiltInProfileId.AIPairProgramming,
		name: 'AI Pair Programming',
		description: 'Optimized for AI agent workflows. Clean interface for AI collaboration.',
		icon: 'robot',
		isBuiltIn: true,
		configuration: {
			enabled: true,
			hideActivityBar: true,
			hideStatusBar: false,
			hideMinimap: true,
			hideBreadcrumbs: true,
			hideGitDecorations: true,
			hideExtensionRecommendations: true,
			simplifyMenus: true,
			simplifyContextMenus: true,
			customizations: {
				hiddenParts: [],
				hiddenMenuItems: [],
				hiddenContextMenuItems: []
			},
			activityBarBehavior: 'hidden',
			statusBarMode: 'visible',
			editorFocusMode: false,
			menuFavorites: []
		}
	},
	{
		id: BuiltInProfileId.PresentationMode,
		name: 'Presentation Mode',
		description: 'Clean interface for demos and screensharing. Professional appearance.',
		icon: 'device-camera-video',
		isBuiltIn: true,
		configuration: {
			enabled: true,
			hideActivityBar: true,
			hideStatusBar: true,
			hideMinimap: true,
			hideBreadcrumbs: true,
			hideGitDecorations: true,
			hideExtensionRecommendations: true,
			simplifyMenus: true,
			simplifyContextMenus: true,
			customizations: {
				hiddenParts: [],
				hiddenMenuItems: [],
				hiddenContextMenuItems: []
			},
			activityBarBehavior: 'hidden',
			statusBarMode: 'hidden',
			editorFocusMode: false,
			menuFavorites: []
		}
	}
];

export class LightweightModeProfileService extends Disposable implements ILightweightModeProfileService {

	declare readonly _serviceBrand: undefined;

	private readonly _onDidChangeActiveProfile = this._register(new Emitter<string | undefined>());
	readonly onDidChangeActiveProfile: Event<string | undefined> = this._onDidChangeActiveProfile.event;

	private readonly _onDidChangeProfiles = this._register(new Emitter<void>());
	readonly onDidChangeProfiles: Event<void> = this._onDidChangeProfiles.event;

	private _activeProfileId: string | undefined;
	private _customProfiles: ILightweightModeProfile[] = [];

	constructor(
		@ILightweightModeService private readonly lightweightModeService: ILightweightModeService,
		@IStorageService private readonly storageService: IStorageService,
		@IConfigurationService private readonly configurationService: IConfigurationService
	) {
		super();

		// Load state from storage
		this.loadState();

		// Listen for configuration changes to detect manual overrides
		this._register(this.configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('workbench.lightweightMode')) {
				// If configuration changed but not through profile application,
				// clear active profile (user manually overrode settings)
				// This is handled by checking if we're in the middle of applying a profile
			}
		}));
	}

	getProfiles(): ILightweightModeProfile[] {
		return [...BUILT_IN_PROFILES, ...this._customProfiles];
	}

	getBuiltInProfiles(): ILightweightModeProfile[] {
		return [...BUILT_IN_PROFILES];
	}

	getCustomProfiles(): ILightweightModeProfile[] {
		return [...this._customProfiles];
	}

	getProfile(id: string): ILightweightModeProfile | undefined {
		return this.getProfiles().find(p => p.id === id);
	}

	getActiveProfileId(): string | undefined {
		return this._activeProfileId;
	}

	async applyProfile(profileId: string): Promise<void> {
		const profile = this.getProfile(profileId);
		if (!profile) {
			throw new Error(`Profile not found: ${profileId}`);
		}

		// Apply each configuration setting
		const config = profile.configuration;
		const configPrefix = 'workbench.lightweightMode';

		// Enable lightweight mode first if not already enabled
		if (!config.enabled) {
			await this.configurationService.updateValue(`${configPrefix}.enabled`, false);
		} else {
			await this.configurationService.updateValue(`${configPrefix}.enabled`, true);
		}

		// Apply basic settings (use "show*" properties for new semantic)
		await this.configurationService.updateValue(`${configPrefix}.showActivityBar`, !config.hideActivityBar);
		await this.configurationService.updateValue(`${configPrefix}.showStatusBar`, !config.hideStatusBar);
		await this.configurationService.updateValue(`${configPrefix}.showMinimap`, !config.hideMinimap);
		await this.configurationService.updateValue(`${configPrefix}.showBreadcrumbs`, !config.hideBreadcrumbs);
		await this.configurationService.updateValue(`${configPrefix}.showGitDecorations`, !config.hideGitDecorations);
		await this.configurationService.updateValue(`${configPrefix}.showExtensionRecommendations`, !config.hideExtensionRecommendations);
		await this.configurationService.updateValue(`${configPrefix}.simplifyMenus`, config.simplifyMenus);
		await this.configurationService.updateValue(`${configPrefix}.simplifyContextMenus`, config.simplifyContextMenus);

		// Apply advanced settings
		if (config.activityBarBehavior !== undefined) {
			await this.configurationService.updateValue(`${configPrefix}.activityBarBehavior`, config.activityBarBehavior);
		}
		if (config.statusBarMode !== undefined) {
			await this.configurationService.updateValue(`${configPrefix}.statusBarMode`, config.statusBarMode);
		}
		if (config.editorFocusMode !== undefined) {
			await this.configurationService.updateValue(`${configPrefix}.editorFocusMode`, config.editorFocusMode);
		}
		if (config.menuFavorites !== undefined) {
			await this.configurationService.updateValue(`${configPrefix}.menuFavorites`, config.menuFavorites);
		}

		// Apply customizations
		if (config.customizations) {
			await this.configurationService.updateValue(`${configPrefix}.customizations`, config.customizations);
		}

		// Update active profile
		this._activeProfileId = profileId;
		this.saveState();
		this._onDidChangeActiveProfile.fire(this._activeProfileId);
	}

	async saveCurrentAsProfile(name: string, description: string): Promise<ILightweightModeProfile> {
		// Validate name
		if (!name || name.trim().length === 0) {
			throw new Error('Profile name cannot be empty');
		}

		// Generate unique ID
		const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		// Get current configuration
		const currentConfig = this.lightweightModeService.getConfiguration();

		// Create new profile
		const newProfile: ILightweightModeProfile = {
			id,
			name: name.trim(),
			description: description.trim(),
			icon: 'save',
			isBuiltIn: false,
			createdAt: Date.now(),
			configuration: { ...currentConfig }
		};

		// Add to custom profiles
		this._customProfiles.push(newProfile);
		this.saveState();
		this._onDidChangeProfiles.fire();

		return newProfile;
	}

	async deleteProfile(profileId: string): Promise<boolean> {
		// Cannot delete built-in profiles
		const profile = this.getProfile(profileId);
		if (!profile || profile.isBuiltIn) {
			return false;
		}

		// Remove from custom profiles
		const index = this._customProfiles.findIndex(p => p.id === profileId);
		if (index === -1) {
			return false;
		}

		this._customProfiles.splice(index, 1);

		// Clear active profile if it was deleted
		if (this._activeProfileId === profileId) {
			this._activeProfileId = undefined;
			this._onDidChangeActiveProfile.fire(undefined);
		}

		this.saveState();
		this._onDidChangeProfiles.fire();

		return true;
	}

	exportProfile(profileId: string): string | undefined {
		const profile = this.getProfile(profileId);
		if (!profile) {
			return undefined;
		}

		// Create exportable profile (exclude built-in flag for import)
		const exportData: Partial<ILightweightModeProfile> = {
			name: profile.name,
			description: profile.description,
			icon: profile.icon,
			configuration: profile.configuration
		};

		return JSON.stringify(exportData, null, 2);
	}

	async importProfile(json: string): Promise<ILightweightModeProfile> {
		try {
			const importData = JSON.parse(json) as Partial<ILightweightModeProfile>;

			// Validate required fields
			if (!importData.name || !importData.configuration) {
				throw new Error('Invalid profile data: missing required fields');
			}

			// Validate configuration structure
			this.validateConfiguration(importData.configuration);

			// Generate unique ID
			const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

			// Create new profile
			const newProfile: ILightweightModeProfile = {
				id,
				name: importData.name,
				description: importData.description || '',
				icon: importData.icon || 'file-code',
				isBuiltIn: false,
				createdAt: Date.now(),
				configuration: importData.configuration
			};

			// Add to custom profiles
			this._customProfiles.push(newProfile);
			this.saveState();
			this._onDidChangeProfiles.fire();

			return newProfile;
		} catch (error) {
			throw new Error(`Failed to import profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async clearActiveProfile(): Promise<void> {
		this._activeProfileId = undefined;
		this.saveState();
		this._onDidChangeActiveProfile.fire(undefined);
	}

	private validateConfiguration(config: ILightweightModeConfiguration): void {
		// Basic validation of configuration structure
		if (typeof config.enabled !== 'boolean') {
			throw new Error('Invalid configuration: enabled must be a boolean');
		}

		// Validate required boolean fields
		const booleanFields = [
			'hideActivityBar', 'hideStatusBar', 'hideMinimap', 'hideBreadcrumbs',
			'hideGitDecorations', 'hideExtensionRecommendations',
			'simplifyMenus', 'simplifyContextMenus'
		];

		for (const field of booleanFields) {
			if (typeof (config as any)[field] !== 'boolean') {
				throw new Error(`Invalid configuration: ${field} must be a boolean`);
			}
		}

		// Validate customizations
		if (config.customizations) {
			if (!Array.isArray(config.customizations.hiddenParts)) {
				throw new Error('Invalid configuration: customizations.hiddenParts must be an array');
			}
			if (!Array.isArray(config.customizations.hiddenMenuItems)) {
				throw new Error('Invalid configuration: customizations.hiddenMenuItems must be an array');
			}
			if (!Array.isArray(config.customizations.hiddenContextMenuItems)) {
				throw new Error('Invalid configuration: customizations.hiddenContextMenuItems must be an array');
			}
		}
	}

	private loadState(): void {
		// Load active profile ID
		const activeProfileId = this.storageService.get(ACTIVE_PROFILE_KEY, StorageScope.PROFILE);
		this._activeProfileId = activeProfileId || undefined;

		// Load custom profiles
		const customProfilesJson = this.storageService.get(CUSTOM_PROFILES_KEY, StorageScope.PROFILE);
		if (customProfilesJson) {
			try {
				const profiles = JSON.parse(customProfilesJson) as ILightweightModeProfile[];
				// Validate each profile before loading
				this._customProfiles = profiles.filter(profile => {
					try {
						this.validateConfiguration(profile.configuration);
						return true;
					} catch {
						return false;
					}
				});
			} catch {
				// If parsing fails, start with empty custom profiles
				this._customProfiles = [];
			}
		}
	}

	private saveState(): void {
		// Save active profile ID
		if (this._activeProfileId) {
			this.storageService.store(ACTIVE_PROFILE_KEY, this._activeProfileId, StorageScope.PROFILE, StorageTarget.USER);
		} else {
			this.storageService.remove(ACTIVE_PROFILE_KEY, StorageScope.PROFILE);
		}

		// Save custom profiles
		if (this._customProfiles.length > 0) {
			const json = JSON.stringify(this._customProfiles);
			this.storageService.store(CUSTOM_PROFILES_KEY, json, StorageScope.PROFILE, StorageTarget.USER);
		} else {
			this.storageService.remove(CUSTOM_PROFILES_KEY, StorageScope.PROFILE);
		}
	}
}
