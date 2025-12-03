/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { ILightweightModeService, ILightweightModeConfiguration, ILightweightModeCustomizations } from '../common/lightweightMode.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { Parts } from '../../layout/browser/layoutService.js';
import { LightweightModeStateManager } from '../../../contrib/lightweightMode/browser/lightweightModeStateManager.js';

const LIGHTWEIGHT_MODE_ENABLED_KEY = 'workbench.lightweightMode.enabled';

export class LightweightModeService extends Disposable implements ILightweightModeService {

	declare readonly _serviceBrand: undefined;

	private readonly _onDidChangeLightweightMode = this._register(new Emitter<boolean>());
	readonly onDidChangeLightweightMode: Event<boolean> = this._onDidChangeLightweightMode.event;

	private _isEnabled: boolean = false;
	private readonly stateManager: LightweightModeStateManager;

	// Granular caching for better performance
	private _cache = {
		hideActivityBar: undefined as boolean | undefined,
		hideStatusBar: undefined as boolean | undefined,
		hideMinimap: undefined as boolean | undefined,
		hideBreadcrumbs: undefined as boolean | undefined,
		hideGitDecorations: undefined as boolean | undefined,
		hideExtensionRecommendations: undefined as boolean | undefined,
		simplifyMenus: undefined as boolean | undefined,
		simplifyContextMenus: undefined as boolean | undefined,
		customizations: undefined as ILightweightModeCustomizations | undefined
	};

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@IStorageService private readonly storageService: IStorageService
	) {
		super();

		// Initialize state manager
		this.stateManager = this._register(new LightweightModeStateManager(this.storageService));
		this.stateManager.loadState();

		// Load initial state from storage (persists across sessions) or fall back to configuration
		const storedValue = this.storageService.get(LIGHTWEIGHT_MODE_ENABLED_KEY, StorageScope.PROFILE);
		if (storedValue !== undefined) {
			this._isEnabled = storedValue === 'true';
		} else {
			this._isEnabled = this.configurationService.getValue<boolean>('workbench.lightweightMode.enabled') ?? false;
		}

		// Listen for configuration changes
		this._register(this.configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('workbench.lightweightMode')) {
				// Granular cache invalidation - only invalidate what changed
				this.invalidateCache(e.affectedKeys);

				const newEnabled = this.configurationService.getValue<boolean>('workbench.lightweightMode.enabled') ?? false;
				if (newEnabled !== this._isEnabled) {
					this._isEnabled = newEnabled;
					this.storageService.store(LIGHTWEIGHT_MODE_ENABLED_KEY, String(this._isEnabled), StorageScope.PROFILE, StorageTarget.USER);
					this._onDidChangeLightweightMode.fire(this._isEnabled);
				}
			}
		}));
	}

	isEnabled(): boolean {
		return this._isEnabled;
	}

	// Convenience accessors for individual configuration values (performance optimization)
	get hideActivityBar(): boolean {
		return this._cache.hideActivityBar ?? this.readAndCache('hideActivityBar', true);
	}

	get hideStatusBar(): boolean {
		return this._cache.hideStatusBar ?? this.readAndCache('hideStatusBar', false);
	}

	get hideMinimap(): boolean {
		return this._cache.hideMinimap ?? this.readAndCache('hideMinimap', true);
	}

	get hideBreadcrumbs(): boolean {
		return this._cache.hideBreadcrumbs ?? this.readAndCache('hideBreadcrumbs', true);
	}

	get hideGitDecorations(): boolean {
		return this._cache.hideGitDecorations ?? this.readAndCache('hideGitDecorations', true);
	}

	get hideExtensionRecommendations(): boolean {
		return this._cache.hideExtensionRecommendations ?? this.readAndCache('hideExtensionRecommendations', true);
	}

	get simplifyMenus(): boolean {
		return this._cache.simplifyMenus ?? this.readAndCache('simplifyMenus', false);
	}

	get simplifyContextMenus(): boolean {
		return this._cache.simplifyContextMenus ?? this.readAndCache('simplifyContextMenus', false);
	}

	async toggle() {
		const newValue = !this._isEnabled;

		await this.configurationService.updateValue('workbench.lightweightMode.enabled', newValue);
		this._isEnabled = newValue;
		this.storageService.store(LIGHTWEIGHT_MODE_ENABLED_KEY, String(this._isEnabled), StorageScope.PROFILE, StorageTarget.USER);
		this._onDidChangeLightweightMode.fire(this._isEnabled);
	}

	getConfiguration(): ILightweightModeConfiguration {
		// Build configuration from granular caches (only reading uncached values)
		return {
			enabled: this._isEnabled,
			hideActivityBar: this._cache.hideActivityBar ?? this.readAndCache('hideActivityBar', true),
			hideStatusBar: this._cache.hideStatusBar ?? this.readAndCache('hideStatusBar', false),
			hideMinimap: this._cache.hideMinimap ?? this.readAndCache('hideMinimap', true),
			hideBreadcrumbs: this._cache.hideBreadcrumbs ?? this.readAndCache('hideBreadcrumbs', true),
			hideGitDecorations: this._cache.hideGitDecorations ?? this.readAndCache('hideGitDecorations', true),
			hideExtensionRecommendations: this._cache.hideExtensionRecommendations ?? this.readAndCache('hideExtensionRecommendations', true),
			simplifyMenus: this._cache.simplifyMenus ?? this.readAndCache('simplifyMenus', false),
			simplifyContextMenus: this._cache.simplifyContextMenus ?? this.readAndCache('simplifyContextMenus', false),
			customizations: this._cache.customizations ?? this.readAndCacheCustomizations()
		};
	}

	private readAndCache<K extends keyof typeof this._cache>(key: K, defaultValue: any): any {
		const value = this.configurationService.getValue<any>(`workbench.lightweightMode.${key}`) ?? defaultValue;
		this._cache[key] = value as any;
		return value;
	}

	private readAndCacheCustomizations(): ILightweightModeCustomizations {
		const defaultCustomizations: ILightweightModeCustomizations = {
			hiddenParts: [],
			hiddenMenuItems: [],
			hiddenContextMenuItems: []
		};
		const value = this.configurationService.getValue<ILightweightModeCustomizations>('workbench.lightweightMode.customizations') ?? defaultCustomizations;
		this._cache.customizations = value;
		return value;
	}

	private invalidateCache(affectedKeys: ReadonlySet<string>): void {
		// Only invalidate cache entries for keys that changed
		for (const key of affectedKeys) {
			const configKey = key.replace('workbench.lightweightMode.', '');
			if (configKey in this._cache) {
				(this._cache as any)[configKey] = undefined;
			}
		}
	}

	shouldHidePart(part: Parts): boolean {
		// Early return for performance - avoid configuration lookup if mode is disabled
		if (!this._isEnabled) {
			return false;
		}

		// Use cached configuration for performance
		const config = this.getConfiguration();

		// Check specific part configurations
		switch (part) {
			case Parts.ACTIVITYBAR_PART:
				return config.hideActivityBar;
			case Parts.STATUSBAR_PART:
				return config.hideStatusBar;
			default:
				return false;
		}
	}

	shouldHideMenuItem(menuId: string, itemId: string): boolean {
		if (!this._isEnabled) {
			return false;
		}

		// For now, return false - menu filtering will be implemented in a later task
		return false;
	}
}
