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
	private _cachedConfiguration: ILightweightModeConfiguration | undefined;
	private readonly stateManager: LightweightModeStateManager;

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
				// Invalidate cache when configuration changes
				this._cachedConfiguration = undefined;

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

	async toggle() {
		const newValue = !this._isEnabled;
		// Invalidate cache before toggling
		this._cachedConfiguration = undefined;

		await this.configurationService.updateValue('workbench.lightweightMode.enabled', newValue);
		this._isEnabled = newValue;
		this.storageService.store(LIGHTWEIGHT_MODE_ENABLED_KEY, String(this._isEnabled), StorageScope.PROFILE, StorageTarget.USER);
		this._onDidChangeLightweightMode.fire(this._isEnabled);
	}

	getConfiguration(): ILightweightModeConfiguration {
		// Return cached configuration if available (performance optimization)
		if (this._cachedConfiguration) {
			return this._cachedConfiguration;
		}

		// Lazy evaluation: only read configuration when needed
		const config = this.configurationService.getValue<ILightweightModeConfiguration>('workbench.lightweightMode');

		const defaultCustomizations: ILightweightModeCustomizations = {
			hiddenParts: [],
			hiddenMenuItems: [],
			hiddenContextMenuItems: []
		};

		// Cache the configuration to avoid repeated lookups
		this._cachedConfiguration = {
			enabled: this._isEnabled,
			hideActivityBar: config?.hideActivityBar ?? true,
			hideStatusBar: config?.hideStatusBar ?? false,
			hideMinimap: config?.hideMinimap ?? true,
			hideBreadcrumbs: config?.hideBreadcrumbs ?? true,
			hideGitDecorations: config?.hideGitDecorations ?? true,
			hideExtensionRecommendations: config?.hideExtensionRecommendations ?? true,
			simplifyMenus: config?.simplifyMenus ?? true,
			simplifyContextMenus: config?.simplifyContextMenus ?? true,
			customizations: config?.customizations ?? defaultCustomizations
		};

		return this._cachedConfiguration;
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
