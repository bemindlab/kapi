/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from '../../../../platform/registry/common/platform.js';
import { IConfigurationRegistry, Extensions as ConfigurationExtensions } from '../../../../platform/configuration/common/configurationRegistry.js';
import { localize } from '../../../../nls.js';
import { IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from '../../../common/contributions.js';
import { LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';
import { LightweightModeLayoutContribution } from './lightweightModeLayoutContribution.js';
import { LightweightModeEditorContribution } from './lightweightModeEditorContribution.js';
import { LightweightModeScmContribution } from './lightweightModeScmContribution.js';
import { LightweightModeDebugContribution } from './lightweightModeDebugContribution.js';
import { LightweightModeStatusBarContribution } from './lightweightModeStatusBarContribution.js';
import { LightweightModeExtensionContribution } from './lightweightModeExtensionContribution.js';
import './lightweightModeActions.js';

// Register configuration
const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration);

configurationRegistry.registerConfiguration({
	id: 'lightweightMode',
	order: 7,
	title: localize('lightweightModeConfigurationTitle', "Lightweight Mode"),
	type: 'object',
	properties: {
		'workbench.lightweightMode.enabled': {
			type: 'boolean',
			default: false,
			description: localize('lightweightMode.enabled', "Enable lightweight editor mode optimized for AI Agent Coding. Hides non-essential UI elements to provide a cleaner, more focused interface.")
		},
		'workbench.lightweightMode.hideActivityBar': {
			type: 'boolean',
			default: true,
			description: localize('lightweightMode.hideActivityBar', "Hide the activity bar when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.hideStatusBar': {
			type: 'boolean',
			default: false,
			description: localize('lightweightMode.hideStatusBar', "Hide the status bar when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.hideMinimap': {
			type: 'boolean',
			default: true,
			description: localize('lightweightMode.hideMinimap', "Hide the minimap when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.hideBreadcrumbs': {
			type: 'boolean',
			default: true,
			description: localize('lightweightMode.hideBreadcrumbs', "Hide breadcrumbs navigation when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.hideGitDecorations': {
			type: 'boolean',
			default: true,
			description: localize('lightweightMode.hideGitDecorations', "Hide git decorations in the file explorer when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.hideExtensionRecommendations': {
			type: 'boolean',
			default: true,
			description: localize('lightweightMode.hideExtensionRecommendations', "Hide extension recommendation notifications when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.simplifyMenus': {
			type: 'boolean',
			default: true,
			description: localize('lightweightMode.simplifyMenus', "Simplify menus by hiding rarely-used items when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.simplifyContextMenus': {
			type: 'boolean',
			default: true,
			description: localize('lightweightMode.simplifyContextMenus', "Simplify context menus when lightweight mode is enabled.")
		}
	}
});

// Register workbench contributions
const workbenchRegistry = Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench);
workbenchRegistry.registerWorkbenchContribution(LightweightModeLayoutContribution, LifecyclePhase.Restored);
workbenchRegistry.registerWorkbenchContribution(LightweightModeEditorContribution, LifecyclePhase.Restored);
workbenchRegistry.registerWorkbenchContribution(LightweightModeScmContribution, LifecyclePhase.Restored);
workbenchRegistry.registerWorkbenchContribution(LightweightModeDebugContribution, LifecyclePhase.Restored);
workbenchRegistry.registerWorkbenchContribution(LightweightModeStatusBarContribution, LifecyclePhase.Restored);
workbenchRegistry.registerWorkbenchContribution(LightweightModeExtensionContribution, LifecyclePhase.Restored);
