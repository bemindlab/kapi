/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { ILightweightModeService, ILightweightModeConfiguration, ILightweightModeCustomizations, ActivityBarBehavior, StatusBarMode } from '../common/lightweightMode.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { Parts } from '../../layout/browser/layoutService.js';
import { LightweightModeStateManager } from '../../../contrib/lightweightMode/browser/lightweightModeStateManager.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import {
	LightweightModeToggledClassification,
	LightweightModeToggledEvent,
	LightweightModeSessionDurationClassification,
	LightweightModeSessionDurationEvent,
	LightweightModeConfigChangedClassification,
	LightweightModeConfigChangedEvent,
	LightweightModeFirstToggleClassification,
	LightweightModeFirstToggleEvent
} from '../common/lightweightModeTelemetry.js';

const LIGHTWEIGHT_MODE_ENABLED_KEY = 'workbench.lightweightMode.enabled';
const LIGHTWEIGHT_MODE_FIRST_SESSION_KEY = 'workbench.lightweightMode.firstSession';
const LIGHTWEIGHT_MODE_FIRST_TOGGLE_KEY = 'workbench.lightweightMode.firstToggle';

export class LightweightModeService extends Disposable implements ILightweightModeService {

	declare readonly _serviceBrand: undefined;

	private readonly _onDidChangeLightweightMode = this._register(new Emitter<boolean>());
	readonly onDidChangeLightweightMode: Event<boolean> = this._onDidChangeLightweightMode.event;

	private _isEnabled: boolean = false;
	private readonly stateManager: LightweightModeStateManager;

	// Telemetry tracking
	private _sessionStartTime: number | undefined;
	private _sessionToggleCount: number = 0;
	private _sessionConfigChangeCount: number = 0;
	private _totalToggleCount: number = 0;

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
		customizations: undefined as ILightweightModeCustomizations | undefined,
		// Advanced options
		activityBarBehavior: undefined as ActivityBarBehavior | undefined,
		statusBarMode: undefined as StatusBarMode | undefined,
		editorFocusMode: undefined as boolean | undefined,
		menuFavorites: undefined as string[] | undefined
	};

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@IStorageService private readonly storageService: IStorageService,
		@ITelemetryService private readonly telemetryService: ITelemetryService
	) {
		super();

		// Initialize state manager
		this.stateManager = this._register(new LightweightModeStateManager(this.storageService));
		this.stateManager.loadState();

		// Track first session for time-to-first-toggle metric
		const firstSession = this.storageService.get(LIGHTWEIGHT_MODE_FIRST_SESSION_KEY, StorageScope.APPLICATION);
		if (!firstSession) {
			this.storageService.store(LIGHTWEIGHT_MODE_FIRST_SESSION_KEY, String(Date.now()), StorageScope.APPLICATION, StorageTarget.MACHINE);
		}

		// Load initial state from storage (persists across sessions) or fall back to configuration
		const storedValue = this.storageService.get(LIGHTWEIGHT_MODE_ENABLED_KEY, StorageScope.PROFILE);
		if (storedValue !== undefined) {
			this._isEnabled = storedValue === 'true';
		} else {
			this._isEnabled = this.configurationService.getValue<boolean>('workbench.lightweightMode.enabled') ?? false;
		}

		// Start session tracking if mode is enabled
		if (this._isEnabled) {
			this._sessionStartTime = Date.now();
		}

		// Listen for configuration changes
		this._register(this.configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('workbench.lightweightMode')) {
				// Granular cache invalidation - only invalidate what changed
				this.invalidateCache(e.affectedKeys);

				// Track which specific settings changed
				if (e.affectedKeys) {
					for (const key of e.affectedKeys) {
						if (key.startsWith('workbench.lightweightMode.') && key !== 'workbench.lightweightMode.enabled') {
							this._sessionConfigChangeCount++;
							this.trackConfigurationChange(key);
						}
					}
				}

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
	// These return false when mode is disabled to ensure nothing is hidden
	get hideActivityBar(): boolean {
		return this._isEnabled && (this._cache.hideActivityBar ?? this.readAndCache('hideActivityBar', true));
	}

	get hideStatusBar(): boolean {
		return this._isEnabled && (this._cache.hideStatusBar ?? this.readAndCache('hideStatusBar', false));
	}

	get hideMinimap(): boolean {
		return this._isEnabled && (this._cache.hideMinimap ?? this.readAndCache('hideMinimap', true));
	}

	get hideBreadcrumbs(): boolean {
		return this._isEnabled && (this._cache.hideBreadcrumbs ?? this.readAndCache('hideBreadcrumbs', true));
	}

	get hideGitDecorations(): boolean {
		return this._isEnabled && (this._cache.hideGitDecorations ?? this.readAndCache('hideGitDecorations', true));
	}

	get hideExtensionRecommendations(): boolean {
		return this._isEnabled && (this._cache.hideExtensionRecommendations ?? this.readAndCache('hideExtensionRecommendations', true));
	}

	get simplifyMenus(): boolean {
		return this._isEnabled && (this._cache.simplifyMenus ?? this.readAndCache('simplifyMenus', true));
	}

	get simplifyContextMenus(): boolean {
		return this._isEnabled && (this._cache.simplifyContextMenus ?? this.readAndCache('simplifyContextMenus', true));
	}

	// Advanced configuration accessors
	get activityBarBehavior(): ActivityBarBehavior {
		if (!this._isEnabled) {
			return 'visible';
		}
		return this._cache.activityBarBehavior ?? this.readAndCache('activityBarBehavior', 'hidden') as ActivityBarBehavior;
	}

	get statusBarMode(): StatusBarMode {
		if (!this._isEnabled) {
			return 'visible';
		}
		return this._cache.statusBarMode ?? this.readAndCache('statusBarMode', 'visible') as StatusBarMode;
	}

	get editorFocusMode(): boolean {
		return this._isEnabled && (this._cache.editorFocusMode ?? this.readAndCache('editorFocusMode', false));
	}

	get menuFavorites(): string[] {
		return this._cache.menuFavorites ?? this.readAndCache('menuFavorites', []) as string[];
	}

	async toggle(from: string = 'unknown') {
		const newValue = !this._isEnabled;
		const wasEnabled = this._isEnabled;

		// Track session duration if disabling
		if (wasEnabled && this._sessionStartTime) {
			this.trackSessionEnd();
		}

		await this.configurationService.updateValue('workbench.lightweightMode.enabled', newValue);
		this._isEnabled = newValue;
		this.storageService.store(LIGHTWEIGHT_MODE_ENABLED_KEY, String(this._isEnabled), StorageScope.PROFILE, StorageTarget.USER);
		this._onDidChangeLightweightMode.fire(this._isEnabled);

		// Track toggle event
		this._totalToggleCount++;
		this._sessionToggleCount++;

		// Check for first toggle
		const firstToggle = this.storageService.get(LIGHTWEIGHT_MODE_FIRST_TOGGLE_KEY, StorageScope.APPLICATION);
		if (!firstToggle) {
			this.trackFirstToggle(newValue);
			this.storageService.store(LIGHTWEIGHT_MODE_FIRST_TOGGLE_KEY, String(Date.now()), StorageScope.APPLICATION, StorageTarget.MACHINE);
		}

		// Track the toggle event
		this.telemetryService.publicLog2<LightweightModeToggledEvent, LightweightModeToggledClassification>(
			'lightweightMode/toggled',
			{
				enabled: newValue,
				from,
				sessionCount: this._sessionToggleCount
			}
		);

		// Start new session if enabling
		if (newValue) {
			this._sessionStartTime = Date.now();
		}
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
			simplifyMenus: this._cache.simplifyMenus ?? this.readAndCache('simplifyMenus', true),
			simplifyContextMenus: this._cache.simplifyContextMenus ?? this.readAndCache('simplifyContextMenus', true),
			customizations: this._cache.customizations ?? this.readAndCacheCustomizations(),
			// Advanced options
			activityBarBehavior: this._cache.activityBarBehavior ?? this.readAndCache('activityBarBehavior', 'hidden') as ActivityBarBehavior,
			statusBarMode: this._cache.statusBarMode ?? this.readAndCache('statusBarMode', 'visible') as StatusBarMode,
			editorFocusMode: this._cache.editorFocusMode ?? this.readAndCache('editorFocusMode', false),
			menuFavorites: this._cache.menuFavorites ?? this.readAndCache('menuFavorites', []) as string[]
		};
	}

	private readAndCache<K extends keyof typeof this._cache>(key: K, defaultValue: any): any {
		// Migration logic: handle both old "hide*" and new "show*" property names
		const propertyMap: { [key: string]: { new: string; old: string } } = {
			'hideActivityBar': { new: 'showActivityBar', old: 'hideActivityBar' },
			'hideStatusBar': { new: 'showStatusBar', old: 'hideStatusBar' },
			'hideMinimap': { new: 'showMinimap', old: 'hideMinimap' },
			'hideBreadcrumbs': { new: 'showBreadcrumbs', old: 'hideBreadcrumbs' },
			'hideGitDecorations': { new: 'showGitDecorations', old: 'hideGitDecorations' },
			'hideExtensionRecommendations': { new: 'showExtensionRecommendations', old: 'hideExtensionRecommendations' }
		};

		const keyStr = String(key);
		if (keyStr in propertyMap) {
			const { new: newProp, old: oldProp } = propertyMap[keyStr];

			// Check if new "show*" property is explicitly set
			const newValue = this.configurationService.getValue<boolean>(`workbench.lightweightMode.${newProp}`);
			if (newValue !== undefined) {
				// Invert for storage in cache (cache stores "hide" semantics for backward compatibility)
				const hideValue = !newValue;
				this._cache[key] = hideValue as any;
				return hideValue;
			}

			// Fall back to old "hide*" property
			const oldValue = this.configurationService.getValue<boolean>(`workbench.lightweightMode.${oldProp}`);
			if (oldValue !== undefined) {
				this._cache[key] = oldValue as any;
				return oldValue;
			}
		}

		// For non-migrated properties or if nothing is set, use default
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

	private invalidateCache(affectedKeys?: ReadonlySet<string>): void {
		// If no specific keys provided, invalidate entire cache
		if (!affectedKeys) {
			for (const key in this._cache) {
				(this._cache as any)[key] = undefined;
			}
			return;
		}

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

	/**
	 * Track the first time lightweight mode is toggled
	 */
	private trackFirstToggle(enabled: boolean): void {
		const firstSession = this.storageService.get(LIGHTWEIGHT_MODE_FIRST_SESSION_KEY, StorageScope.APPLICATION);
		if (firstSession) {
			const timeToFirstToggle = Date.now() - parseInt(firstSession, 10);
			this.telemetryService.publicLog2<LightweightModeFirstToggleEvent, LightweightModeFirstToggleClassification>(
				'lightweightMode/firstToggle',
				{
					timeToFirstToggleMs: timeToFirstToggle,
					enabledOnFirstToggle: enabled
				}
			);
		}
	}

	/**
	 * Track when a lightweight mode session ends
	 */
	private trackSessionEnd(): void {
		if (!this._sessionStartTime) {
			return;
		}

		const duration = Date.now() - this._sessionStartTime;
		this.telemetryService.publicLog2<LightweightModeSessionDurationEvent, LightweightModeSessionDurationClassification>(
			'lightweightMode/sessionDuration',
			{
				durationMs: duration,
				toggleCount: this._sessionToggleCount,
				configChanges: this._sessionConfigChangeCount
			}
		);

		// Reset session counters
		this._sessionStartTime = undefined;
		this._sessionConfigChangeCount = 0;
	}

	/**
	 * Track when a configuration setting is changed
	 */
	private trackConfigurationChange(settingKey: string): void {
		// Extract the setting name (remove 'workbench.lightweightMode.' prefix)
		const settingName = settingKey.replace('workbench.lightweightMode.', '');

		// Get the value type (not the actual value for privacy)
		const value = this.configurationService.getValue<unknown>(settingKey);
		let valueType = 'unknown';
		if (value === undefined || value === null) {
			valueType = 'undefined';
		} else if (Array.isArray(value)) {
			valueType = 'array';
		} else {
			valueType = typeof value;
		}

		this.telemetryService.publicLog2<LightweightModeConfigChangedEvent, LightweightModeConfigChangedClassification>(
			'lightweightMode/configChanged',
			{
				settingKey: settingName,
				newValue: valueType,
				isEnabled: this._isEnabled
			}
		);
	}

	override dispose(): void {
		// Track session end if mode is enabled when disposing
		if (this._isEnabled && this._sessionStartTime) {
			this.trackSessionEnd();
		}
		super.dispose();
	}
}
