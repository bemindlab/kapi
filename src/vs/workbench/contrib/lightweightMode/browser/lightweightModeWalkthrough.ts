/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../nls.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { BuiltinGettingStartedCategory, BuiltinGettingStartedStep } from '../../welcomeGettingStarted/common/gettingStartedContent.js';

const lightweightModeIcon = registerIcon(
	'getting-started-lightweight-mode',
	Codicon.zap,
	localize('getting-started-lightweight-mode-icon', "Icon used for the lightweight mode walkthrough")
);

/**
 * Helper to create a button link for walkthrough steps.
 */
function Button(title: string, href: string): string {
	return `[${title}](${href})`;
}

/**
 * Lightweight Mode walkthrough steps.
 */
const lightweightModeSteps: BuiltinGettingStartedStep[] = [
	{
		id: 'lightweightMode.introduction',
		title: localize('lightweightMode.walkthrough.introduction.title', "What is Lightweight Mode?"),
		description: localize(
			'lightweightMode.walkthrough.introduction.description',
			"Lightweight Mode simplifies your VS Code interface to help you focus on what matters: your code. It hides non-essential UI elements like decorations, recommendations, and complex menus, creating a cleaner, faster editing experience ideal for AI-assisted coding workflows.\n\nKey benefits:\n- Reduced visual clutter\n- Faster navigation\n- More screen space for code\n- Optimized for focused work\n\n{0}",
			Button(localize('nextStep', "Continue"), 'command:welcome.markStepComplete?lightweightMode.walkthrough#lightweightMode.introduction')
		),
		media: {
			type: 'image',
			path: {
				hc: 'media/walkthrough/lightweightMode.svg',
				hcLight: 'media/walkthrough/lightweightMode.svg',
				light: 'media/walkthrough/lightweightMode.svg',
				dark: 'media/walkthrough/lightweightMode.svg'
			},
			altText: localize('lightweightMode.walkthrough.introduction.altText', "Comparison of standard VS Code and Lightweight Mode")
		}
	},
	{
		id: 'lightweightMode.toggle',
		title: localize('lightweightMode.walkthrough.toggle.title', "How to Toggle"),
		description: localize(
			'lightweightMode.walkthrough.toggle.description',
			"You can toggle Lightweight Mode on or off in several ways:\n\n**Command Palette**: Press {0} and search for \"Toggle Lightweight Mode\"\n\n**Keyboard Shortcut**: Use the keyboard shortcut (you can customize this in keyboard settings)\n\n**Status Bar**: Click the lightning bolt indicator when Lightweight Mode is active\n\nTry it now! {1}",
			'`Ctrl+Shift+P` (`Cmd+Shift+P` on Mac)',
			Button(
				localize('tryToggle', "Toggle Lightweight Mode"),
				'command:workbench.action.toggleLightweightMode'
			)
		),
		completionEvents: [
			'onCommand:workbench.action.toggleLightweightMode'
		],
		media: {
			type: 'image',
			path: {
				hc: 'media/walkthrough/toggle.svg',
				hcLight: 'media/walkthrough/toggle.svg',
				light: 'media/walkthrough/toggle.svg',
				dark: 'media/walkthrough/toggle.svg'
			},
			altText: localize('lightweightMode.walkthrough.toggle.altText', "Multiple ways to toggle Lightweight Mode")
		}
	},
	{
		id: 'lightweightMode.configuration',
		title: localize('lightweightMode.walkthrough.configuration.title', "Customize Your Experience"),
		description: localize(
			'lightweightMode.walkthrough.configuration.description',
			"Lightweight Mode is highly customizable. You can control what gets hidden:\n\n- **Activity Bar**: Choose to hide, show, or auto-hide\n- **Status Bar**: Hide completely, show minimal info, or keep full\n- **Minimap**: Hide the code minimap for more space\n- **Breadcrumbs**: Hide file path breadcrumbs\n- **Git Decorations**: Hide inline git indicators\n- **Menus**: Simplify context and top menus\n\nCustomize these settings to match your workflow. {0}",
			Button(
				localize('openSettings', "Open Settings"),
				'command:workbench.action.openSettings?%5B%22workbench.lightweightMode%22%5D'
			)
		),
		completionEvents: [
			'onCommand:workbench.action.openSettings'
		],
		media: {
			type: 'image',
			path: {
				hc: 'media/walkthrough/settings.svg',
				hcLight: 'media/walkthrough/settings.svg',
				light: 'media/walkthrough/settings.svg',
				dark: 'media/walkthrough/settings.svg'
			},
			altText: localize('lightweightMode.walkthrough.configuration.altText', "Lightweight Mode settings panel")
		}
	},
	{
		id: 'lightweightMode.tryItYourself',
		title: localize('lightweightMode.walkthrough.tryItYourself.title', "Try It Yourself"),
		description: localize(
			'lightweightMode.walkthrough.tryItYourself.description',
			"Now it's your turn! Toggle Lightweight Mode and see how it transforms your workspace.\n\nNotice:\n- Cleaner interface with fewer distractions\n- More space for your code editor\n- Simplified menus and decorations\n- Status bar indicator showing mode is active\n\nYou can always toggle back to the standard interface when you need full features. Find the perfect balance for your workflow!\n\n{0}\n\n{1}",
			Button(
				localize('toggleMode', "Toggle Lightweight Mode"),
				'command:workbench.action.toggleLightweightMode'
			),
			Button(
				localize('completeWalkthrough', "Complete Walkthrough"),
				'command:welcome.markStepComplete?lightweightMode.walkthrough#lightweightMode.tryItYourself'
			)
		),
		completionEvents: [
			'onCommand:workbench.action.toggleLightweightMode'
		],
		media: {
			type: 'image',
			path: {
				hc: 'media/walkthrough/try.svg',
				hcLight: 'media/walkthrough/try.svg',
				light: 'media/walkthrough/try.svg',
				dark: 'media/walkthrough/try.svg'
			},
			altText: localize('lightweightMode.walkthrough.tryItYourself.altText', "Try Lightweight Mode yourself")
		}
	},
	{
		id: 'lightweightMode.learnMore',
		title: localize('lightweightMode.walkthrough.learnMore.title', "Learn More & Get Help"),
		description: localize(
			'lightweightMode.walkthrough.learnMore.description',
			"Need more help or want to dive deeper?\n\n**Settings**: Fine-tune every aspect of Lightweight Mode {0}\n\n**Keyboard Shortcuts**: Assign custom shortcuts {1}\n\n**Command Palette**: Access all Lightweight Mode commands by searching for \"Lightweight\"\n\n**Status Bar Help**: Click the lightning bolt icon in the status bar for quick access\n\nEnjoy your streamlined coding experience!",
			Button(
				localize('viewSettings', "View Settings"),
				'command:workbench.action.openSettings?%5B%22workbench.lightweightMode%22%5D'
			),
			Button(
				localize('customizeShortcuts', "Customize Shortcuts"),
				'command:workbench.action.openGlobalKeybindings?%5B%22workbench.action.toggleLightweightMode%22%5D'
			)
		),
		media: {
			type: 'image',
			path: {
				hc: 'media/walkthrough/help.svg',
				hcLight: 'media/walkthrough/help.svg',
				light: 'media/walkthrough/help.svg',
				dark: 'media/walkthrough/help.svg'
			},
			altText: localize('lightweightMode.walkthrough.learnMore.altText', "Get help with Lightweight Mode")
		}
	}
];

/**
 * Lightweight Mode walkthrough category definition.
 * This will be registered with the IWalkthroughsService.
 */
export const lightweightModeWalkthrough: BuiltinGettingStartedCategory = {
	id: 'lightweightMode.walkthrough',
	title: localize('lightweightMode.walkthrough.title', "Discover Lightweight Mode"),
	description: localize(
		'lightweightMode.walkthrough.description',
		"Learn how to simplify your editor for a focused coding experience"
	),
	isFeatured: true,
	icon: lightweightModeIcon,
	walkthroughPageTitle: localize('lightweightMode.walkthrough.pageTitle', "Lightweight Mode Walkthrough"),
	content: {
		type: 'steps',
		steps: lightweightModeSteps
	}
};
