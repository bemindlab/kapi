/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { ILightweightModeService } from '../../../services/lightweightMode/common/lightweightMode.js';
import { localize } from '../../../../nls.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import './media/lightweightModeWelcome.css';

/**
 * Provides a minimal welcome experience when lightweight mode is active.
 * Replaces the standard welcome screen with a focused, distraction-free alternative.
 */
export class LightweightModeWelcomeContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.lightweightModeWelcome';

	private welcomePageVisible = false;

	constructor(
		@ILightweightModeService private readonly lightweightModeService: ILightweightModeService,
		@IEditorService private readonly editorService: IEditorService,
		@ICommandService private readonly commandService: ICommandService
	) {
		super();

		// Listen for lightweight mode changes
		this._register(this.lightweightModeService.onDidChangeLightweightMode(enabled => {
			this.updateWelcomeScreen(enabled);
		}));

		// Check initial state
		if (this.lightweightModeService.isEnabled()) {
			this.updateWelcomeScreen(true);
		}
	}

	private updateWelcomeScreen(enabled: boolean): void {
		if (enabled && !this.welcomePageVisible) {
			// Show minimal welcome when entering lightweight mode
			this.showMinimalWelcome();
		} else if (!enabled && this.welcomePageVisible) {
			// Restore normal welcome when exiting lightweight mode
			this.hideMinimalWelcome();
		}
	}

	private showMinimalWelcome(): void {
		// Add CSS class to body for minimal welcome styling
		document.body.classList.add('lightweight-mode-welcome');
		this.welcomePageVisible = true;

		// Create minimal welcome overlay
		this.createMinimalWelcomeOverlay();
	}

	private hideMinimalWelcome(): void {
		document.body.classList.remove('lightweight-mode-welcome');
		this.welcomePageVisible = false;

		// Remove overlay
		const overlay = document.querySelector('.lightweight-welcome-overlay');
		if (overlay) {
			overlay.remove();
		}
	}

	private createMinimalWelcomeOverlay(): void {
		// Only show on welcome page (when no editors are open)
		const activeEditors = this.editorService.editors.length;
		if (activeEditors > 0) {
			return;
		}

		const existingOverlay = document.querySelector('.lightweight-welcome-overlay');
		if (existingOverlay) {
			return;
		}

		const overlay = document.createElement('div');
		overlay.className = 'lightweight-welcome-overlay';
		overlay.innerHTML = `
			<div class="lightweight-welcome-container">
				<div class="lightweight-welcome-header">
					<h1 class="lightweight-welcome-title"><span class="codicon codicon-zap"></span> ${localize('lightweightWelcome.title', 'Focused Mode')}</h1>
					<p class="lightweight-welcome-subtitle">${localize('lightweightWelcome.subtitle', 'Simplified interface for distraction-free coding')}</p>
				</div>

				<div class="lightweight-welcome-actions">
					<button class="lightweight-welcome-btn primary" data-action="newFile">
						<span class="codicon codicon-new-file"></span>
						${localize('lightweightWelcome.newFile', 'New File')}
					</button>
					<button class="lightweight-welcome-btn primary" data-action="openFolder">
						<span class="codicon codicon-folder-opened"></span>
						${localize('lightweightWelcome.openFolder', 'Open Folder')}
					</button>
					<button class="lightweight-welcome-btn secondary" data-action="openRecent">
						<span class="codicon codicon-history"></span>
						${localize('lightweightWelcome.openRecent', 'Open Recent')}
					</button>
				</div>

				<div class="lightweight-welcome-secondary-actions">
					<button class="lightweight-welcome-btn-small" data-action="terminal">
						<span class="codicon codicon-terminal"></span>
						${localize('lightweightWelcome.terminal', 'Terminal')}
					</button>
					<button class="lightweight-welcome-btn-small" data-action="commandPalette">
						<span class="codicon codicon-search"></span>
						${localize('lightweightWelcome.commandPalette', 'Commands')}
					</button>
					<button class="lightweight-welcome-btn-small" data-action="settings">
						<span class="codicon codicon-settings-gear"></span>
						${localize('lightweightWelcome.settings', 'Settings')}
					</button>
				</div>

				<div class="lightweight-welcome-footer">
					<div class="lightweight-welcome-shortcuts">
						<div class="lightweight-welcome-shortcut">
							<kbd>Cmd+P</kbd>
							<span>${localize('lightweightWelcome.quickOpen', 'Quick Open')}</span>
						</div>
						<div class="lightweight-welcome-shortcut">
							<kbd>Cmd+Shift+P</kbd>
							<span>${localize('lightweightWelcome.commands', 'Commands')}</span>
						</div>
						<div class="lightweight-welcome-shortcut">
							<kbd>Cmd+Alt+L</kbd>
							<span>${localize('lightweightWelcome.toggleMode', 'Toggle Mode')}</span>
						</div>
					</div>
				</div>
			</div>
		`;

		// Add event listeners for primary actions
		const newFileBtn = overlay.querySelector('[data-action="newFile"]');
		const openFolderBtn = overlay.querySelector('[data-action="openFolder"]');
		const openRecentBtn = overlay.querySelector('[data-action="openRecent"]');

		if (newFileBtn) {
			newFileBtn.addEventListener('click', () => {
				this.commandService.executeCommand('workbench.action.files.newUntitledFile');
			});
		}

		if (openFolderBtn) {
			openFolderBtn.addEventListener('click', () => {
				this.commandService.executeCommand('workbench.action.files.openFolder');
			});
		}

		if (openRecentBtn) {
			openRecentBtn.addEventListener('click', () => {
				this.commandService.executeCommand('workbench.action.openRecent');
			});
		}

		// Add event listeners for secondary actions
		const terminalBtn = overlay.querySelector('[data-action="terminal"]');
		const commandPaletteBtn = overlay.querySelector('[data-action="commandPalette"]');
		const settingsBtn = overlay.querySelector('[data-action="settings"]');

		if (terminalBtn) {
			terminalBtn.addEventListener('click', () => {
				this.commandService.executeCommand('workbench.action.terminal.new');
			});
		}

		if (commandPaletteBtn) {
			commandPaletteBtn.addEventListener('click', () => {
				this.commandService.executeCommand('workbench.action.showCommands');
			});
		}

		if (settingsBtn) {
			settingsBtn.addEventListener('click', () => {
				this.commandService.executeCommand('workbench.action.openSettings');
			});
		}

		document.body.appendChild(overlay);

		// Remove overlay when editors are opened
		this._register(this.editorService.onDidActiveEditorChange(() => {
			if (this.editorService.editors.length > 0) {
				this.hideMinimalWelcome();
			}
		}));
	}
}
