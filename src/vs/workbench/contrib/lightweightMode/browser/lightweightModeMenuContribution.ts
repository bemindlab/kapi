/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { ILightweightModeService } from '../../../services/lightweightMode/common/lightweightMode.js';

/**
 * Menu items to hide in lightweight mode
 * These are menu items not commonly used in AI-assisted workflows
 */
const HIDDEN_MENU_ITEMS = [
	// File menu - hide rarely used items
	'workbench.action.files.revert',
	'workbench.action.files.saveWithoutFormatting',
	'workbench.action.openSettings2',

	// Edit menu - hide advanced items
	'editor.action.toggleWordWrap',
	'editor.action.toggleRenderWhitespace',
	'editor.action.toggleRenderControlCharacter',

	// View menu - hide appearance items
	'workbench.action.toggleMenuBar',
	'workbench.action.toggleStatusbarVisibility',
	'workbench.action.toggleSidebarVisibility',

	// Go menu - hide advanced navigation
	'workbench.action.gotoSymbol',
	'workbench.action.showAllSymbols',

	// Run menu - hide advanced debug options
	'workbench.action.debug.stepOver',
	'workbench.action.debug.stepInto',
	'workbench.action.debug.stepOut',

	// Terminal menu - hide advanced options
	'workbench.action.terminal.split',
	'workbench.action.terminal.scrollToTop',
	'workbench.action.terminal.scrollToBottom',

	// Help menu - hide rarely used items
	'workbench.action.openDocumentationUrl',
	'workbench.action.openIntroductoryVideosUrl',
	'workbench.action.openTipsAndTricksUrl'
];

/**
 * Context menu items to hide in lightweight mode
 * These are context menu options that are redundant or rarely used
 */
const HIDDEN_CONTEXT_MENU_ITEMS = [
	// Editor context menu
	'editor.action.changeAll',
	'editor.action.formatDocument.multiple',
	'editor.action.sourceAction',
	'editor.action.refactor',
	'editor.action.organizeImports',
	'editor.action.autoFix',

	// Explorer context menu
	'filesExplorer.copy',
	'filesExplorer.paste',
	'filesExplorer.findInFolder',
	'filesExplorer.compareWithClipboard',
	'filesExplorer.revealInExplorer',

	// SCM context menu
	'scm.viewChanges',
	'scm.openChanges',
	'scm.openFile',
	'scm.stage',
	'scm.unstage'
];

/**
 * Essential menu items that must always remain accessible
 * These are file operations, editing commands, and terminal access
 */
const ESSENTIAL_MENU_ITEMS = [
	// File operations
	'workbench.action.files.newUntitledFile',
	'workbench.action.files.openFile',
	'workbench.action.files.openFolder',
	'workbench.action.files.save',
	'workbench.action.files.saveAs',
	'workbench.action.files.saveAll',
	'workbench.action.closeActiveEditor',

	// Editing commands
	'editor.action.clipboardCutAction',
	'editor.action.clipboardCopyAction',
	'editor.action.clipboardPasteAction',
	'undo',
	'redo',
	'editor.action.selectAll',
	'editor.action.find',
	'editor.action.replace',

	// Terminal access
	'workbench.action.terminal.new',
	'workbench.action.terminal.toggleTerminal',

	// Command palette
	'workbench.action.showCommands'
];

export class LightweightModeMenuContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.lightweightModeMenu';

	constructor(
		@ILightweightModeService private readonly lightweightModeService: ILightweightModeService
	) {
		super();
	}

	/**
	 * Check if a menu item should be hidden in lightweight mode
	 */
	shouldHideMenuItem(menuId: string, itemId: string): boolean {
		if (!this.lightweightModeService.isEnabled()) {
			return false;
		}

		const config = this.lightweightModeService.getConfiguration();

		// If menu simplification is disabled, don't hide anything
		if (!config.simplifyMenus) {
			return false;
		}

		// Never hide essential items
		if (ESSENTIAL_MENU_ITEMS.includes(itemId)) {
			return false;
		}

		// Hide items in the hidden list
		return HIDDEN_MENU_ITEMS.includes(itemId);
	}

	/**
	 * Check if a context menu item should be hidden in lightweight mode
	 */
	shouldHideContextMenuItem(menuId: string, itemId: string): boolean {
		if (!this.lightweightModeService.isEnabled()) {
			return false;
		}

		const config = this.lightweightModeService.getConfiguration();

		// If context menu simplification is disabled, don't hide anything
		if (!config.simplifyContextMenus) {
			return false;
		}

		// Never hide essential items
		if (ESSENTIAL_MENU_ITEMS.includes(itemId)) {
			return false;
		}

		// Hide items in the hidden list
		return HIDDEN_CONTEXT_MENU_ITEMS.includes(itemId);
	}

	/**
	 * Get list of essential menu items that must remain accessible
	 */
	getEssentialMenuItems(): string[] {
		return [...ESSENTIAL_MENU_ITEMS];
	}
}
