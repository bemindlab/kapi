/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { Event } from '../../../../base/common/event.js';
import { Parts } from '../../layout/browser/layoutService.js';

export const ILightweightModeService = createDecorator<ILightweightModeService>('lightweightModeService');

export interface ILightweightModeConfiguration {
	enabled: boolean;
	hideActivityBar: boolean;
	hideStatusBar: boolean;
	hideMinimap: boolean;
	hideBreadcrumbs: boolean;
	hideGitDecorations: boolean;
	hideExtensionRecommendations: boolean;
	simplifyMenus: boolean;
	simplifyContextMenus: boolean;
	customizations: ILightweightModeCustomizations;
}

export interface ILightweightModeCustomizations {
	readonly hiddenParts: readonly Parts[];
	readonly hiddenMenuItems: readonly string[];
	readonly hiddenContextMenuItems: readonly string[];
}

export interface ILightweightModeService {
	readonly _serviceBrand: undefined;

	/**
	 * Emits when lightweight mode is enabled or disabled.
	 */
	readonly onDidChangeLightweightMode: Event<boolean>;

	/**
	 * Returns whether lightweight mode is currently enabled.
	 */
	isEnabled(): boolean;

	/**
	 * Toggles lightweight mode on or off.
	 */
	toggle(): Promise<void>;

	/**
	 * Gets the current lightweight mode configuration.
	 */
	getConfiguration(): ILightweightModeConfiguration;

	/**
	 * Determines if a specific part should be hidden in lightweight mode.
	 */
	shouldHidePart(part: Parts): boolean;

	/**
	 * Determines if a specific menu item should be hidden in lightweight mode.
	 */
	shouldHideMenuItem(menuId: string, itemId: string): boolean;

	/**
	 * Convenience accessors for individual configuration values.
	 * These are more efficient than calling getConfiguration() for each value.
	 */
	readonly hideActivityBar: boolean;
	readonly hideStatusBar: boolean;
	readonly hideMinimap: boolean;
	readonly hideBreadcrumbs: boolean;
	readonly hideGitDecorations: boolean;
	readonly hideExtensionRecommendations: boolean;
	readonly simplifyMenus: boolean;
	readonly simplifyContextMenus: boolean;
}
