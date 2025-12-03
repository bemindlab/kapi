/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/lightweightMode.css';
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
import { LightweightModeWelcomeContribution } from './lightweightModeWelcomeContribution.js';
import { LightweightModeOnboardingContribution } from './lightweightModeOnboarding.js';
import { lightweightModeWalkthrough } from './lightweightModeWalkthrough.js';
import { IWalkthroughsService } from '../../welcomeGettingStarted/browser/gettingStartedService.js';
import { ContextKeyExpr } from '../../../../platform/contextkey/common/contextkey.js';
import { URI } from '../../../../base/common/uri.js';
import { FileAccess } from '../../../../base/common/network.js';
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
		// New positively-named properties (preferred)
		'workbench.lightweightMode.showActivityBar': {
			type: 'boolean',
			default: false,
			description: localize('lightweightMode.showActivityBar', "Show the activity bar when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.showStatusBar': {
			type: 'boolean',
			default: true,
			description: localize('lightweightMode.showStatusBar', "Show the status bar when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.showMinimap': {
			type: 'boolean',
			default: false,
			description: localize('lightweightMode.showMinimap', "Show the minimap when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.showBreadcrumbs': {
			type: 'boolean',
			default: false,
			description: localize('lightweightMode.showBreadcrumbs', "Show breadcrumbs navigation when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.showGitDecorations': {
			type: 'boolean',
			default: false,
			description: localize('lightweightMode.showGitDecorations', "Show git decorations in the file explorer when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.showExtensionRecommendations': {
			type: 'boolean',
			default: false,
			description: localize('lightweightMode.showExtensionRecommendations', "Show extension recommendation notifications when lightweight mode is enabled.")
		},
		// Deprecated properties (backward compatibility)
		'workbench.lightweightMode.hideActivityBar': {
			type: 'boolean',
			default: true,
			deprecationMessage: localize('lightweightMode.hideActivityBar.deprecated', "Deprecated: Use 'workbench.lightweightMode.showActivityBar' instead."),
			description: localize('lightweightMode.hideActivityBar', "Hide the activity bar when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.hideStatusBar': {
			type: 'boolean',
			default: false,
			deprecationMessage: localize('lightweightMode.hideStatusBar.deprecated', "Deprecated: Use 'workbench.lightweightMode.showStatusBar' instead."),
			description: localize('lightweightMode.hideStatusBar', "Hide the status bar when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.hideMinimap': {
			type: 'boolean',
			default: true,
			deprecationMessage: localize('lightweightMode.hideMinimap.deprecated', "Deprecated: Use 'workbench.lightweightMode.showMinimap' instead."),
			description: localize('lightweightMode.hideMinimap', "Hide the minimap when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.hideBreadcrumbs': {
			type: 'boolean',
			default: true,
			deprecationMessage: localize('lightweightMode.hideBreadcrumbs.deprecated', "Deprecated: Use 'workbench.lightweightMode.showBreadcrumbs' instead."),
			description: localize('lightweightMode.hideBreadcrumbs', "Hide breadcrumbs navigation when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.hideGitDecorations': {
			type: 'boolean',
			default: true,
			deprecationMessage: localize('lightweightMode.hideGitDecorations.deprecated', "Deprecated: Use 'workbench.lightweightMode.showGitDecorations' instead."),
			description: localize('lightweightMode.hideGitDecorations', "Hide git decorations in the file explorer when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.hideExtensionRecommendations': {
			type: 'boolean',
			default: true,
			deprecationMessage: localize('lightweightMode.hideExtensionRecommendations.deprecated', "Deprecated: Use 'workbench.lightweightMode.showExtensionRecommendations' instead."),
			description: localize('lightweightMode.hideExtensionRecommendations', "Hide extension recommendation notifications when lightweight mode is enabled.")
		},
		// These remain unchanged (already positively named or contextually appropriate)
		'workbench.lightweightMode.simplifyMenus': {
			type: 'boolean',
			default: true,
			description: localize('lightweightMode.simplifyMenus', "Simplify menus by hiding rarely-used items when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.simplifyContextMenus': {
			type: 'boolean',
			default: true,
			description: localize('lightweightMode.simplifyContextMenus', "Simplify context menus when lightweight mode is enabled.")
		},
		// Advanced customization options
		'workbench.lightweightMode.activityBarBehavior': {
			type: 'string',
			enum: ['hidden', 'visible', 'auto'],
			default: 'hidden',
			enumDescriptions: [
				localize('lightweightMode.activityBarBehavior.hidden', "Hide the activity bar completely"),
				localize('lightweightMode.activityBarBehavior.visible', "Keep the activity bar visible"),
				localize('lightweightMode.activityBarBehavior.auto', "Show activity bar on hover (auto-hide)")
			],
			description: localize('lightweightMode.activityBarBehavior', "Control activity bar visibility behavior when lightweight mode is enabled. Overrides 'showActivityBar' setting if specified.")
		},
		'workbench.lightweightMode.statusBarMode': {
			type: 'string',
			enum: ['hidden', 'visible', 'minimal'],
			default: 'visible',
			enumDescriptions: [
				localize('lightweightMode.statusBarMode.hidden', "Hide the status bar completely"),
				localize('lightweightMode.statusBarMode.visible', "Show the full status bar"),
				localize('lightweightMode.statusBarMode.minimal', "Show only essential status bar items")
			],
			description: localize('lightweightMode.statusBarMode', "Control status bar display mode when lightweight mode is enabled. Overrides 'showStatusBar' setting if specified.")
		},
		'workbench.lightweightMode.editorFocusMode': {
			type: 'boolean',
			default: false,
			description: localize('lightweightMode.editorFocusMode', "Enable focus mode: hide all UI elements except the editor and essential navigation when lightweight mode is enabled.")
		},
		'workbench.lightweightMode.menuFavorites': {
			type: 'array',
			items: {
				type: 'string'
			},
			default: [],
			description: localize('lightweightMode.menuFavorites', "List of menu command IDs to always show even when 'simplifyMenus' is enabled. Example: ['workbench.action.files.save', 'workbench.action.terminal.new']")
		},
		// Onboarding configuration
		'workbench.lightweightMode.onboarding.enabled': {
			type: 'boolean',
			default: true,
			description: localize('lightweightMode.onboarding.enabled', "Enable first-time onboarding notifications and walkthrough for lightweight mode.")
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
workbenchRegistry.registerWorkbenchContribution(LightweightModeWelcomeContribution, LifecyclePhase.Restored);
workbenchRegistry.registerWorkbenchContribution(LightweightModeOnboardingContribution, LifecyclePhase.Restored);

// Register lightweight mode walkthrough
// This needs to be done during module initialization to ensure the walkthrough is available
class LightweightModeWalkthroughRegistration {
	constructor(
		@IWalkthroughsService private readonly walkthroughsService: IWalkthroughsService
	) {
		this.registerWalkthrough();
	}

	private registerWalkthrough(): void {
		// Base path for walkthrough media files
		const basePath = FileAccess.asFileUri('vs/workbench/contrib/lightweightMode/browser').toString();
		const baseUri = URI.parse(basePath);

		// Convert the built-in walkthrough definition to the format expected by IWalkthroughsService
		this.walkthroughsService.registerWalkthrough({
			id: lightweightModeWalkthrough.id,
			title: lightweightModeWalkthrough.title,
			description: lightweightModeWalkthrough.description,
			order: 100, // Order among all walkthroughs
			source: 'Built-In',
			isFeatured: lightweightModeWalkthrough.isFeatured,
			when: ContextKeyExpr.true(), // Always available
			walkthroughPageTitle: lightweightModeWalkthrough.walkthroughPageTitle,
			icon: {
				type: 'icon',
				icon: lightweightModeWalkthrough.icon
			},
			steps: lightweightModeWalkthrough.content.steps.map((step, index) => {
				// Convert media paths to URIs
				let media: any;
				if (step.media.type === 'image' && typeof step.media.path === 'object') {
					media = {
						type: 'image',
						path: {
							hcDark: URI.joinPath(baseUri, step.media.path.hc),
							hcLight: URI.joinPath(baseUri, step.media.path.hcLight ?? step.media.path.hc),
							light: URI.joinPath(baseUri, step.media.path.light),
							dark: URI.joinPath(baseUri, step.media.path.dark)
						},
						altText: step.media.altText
					};
				} else {
					media = step.media;
				}

				return {
					id: step.id,
					title: step.title,
					description: step.description, // Service will parse this string internally
					category: lightweightModeWalkthrough.id,
					order: index,
					when: ContextKeyExpr.deserialize(step.when) ?? ContextKeyExpr.true(),
					completionEvents: step.completionEvents ?? [],
					media
				};
			})
		});
	}
}

workbenchRegistry.registerWorkbenchContribution(LightweightModeWalkthroughRegistration, LifecyclePhase.Restored);
