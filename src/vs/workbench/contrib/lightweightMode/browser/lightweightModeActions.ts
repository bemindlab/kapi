/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize, localize2 } from '../../../../nls.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { ILightweightModeService } from '../../../services/lightweightMode/common/lightweightMode.js';
import { ILightweightModeProfileService } from '../../../services/lightweightMode/common/lightweightModeProfiles.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { KeyMod, KeyCode } from '../../../../base/common/keyCodes.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { IQuickInputService, IQuickPickItem, IQuickPickSeparator } from '../../../../platform/quickinput/common/quickInput.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { IFileDialogService } from '../../../../platform/dialogs/common/dialogs.js';
import { URI } from '../../../../base/common/uri.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { VSBuffer } from '../../../../base/common/buffer.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';

// Toggle Lightweight Mode Action
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.toggleLightweightMode',
			title: localize2('toggleLightweightMode', "Toggle Lightweight Editor Mode"),
			category: Categories.View,
			f1: true,
			keybinding: {
				weight: KeybindingWeight.WorkbenchContrib,
				primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KeyL
			}
		});
	}

	async run(accessor: ServicesAccessor) {
		const lightweightModeService = accessor.get(ILightweightModeService);
		await lightweightModeService.toggle();
	}
});

// Select Lightweight Mode Profile Action
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.selectLightweightModeProfile',
			title: localize2('selectLightweightModeProfile', "Select Lightweight Mode Profile"),
			category: Categories.View,
			f1: true
		});
	}

	async run(accessor: ServicesAccessor) {
		const profileService = accessor.get(ILightweightModeProfileService);
		const quickInputService = accessor.get(IQuickInputService);
		const notificationService = accessor.get(INotificationService);

		const profiles = profileService.getProfiles();
		const activeProfileId = profileService.getActiveProfileId();

		interface ProfileQuickPickItem extends IQuickPickItem {
			profileId: string;
		}

		const items: Array<ProfileQuickPickItem | IQuickPickSeparator> = [];

		// Built-in profiles
		const builtInProfiles = profiles.filter(p => p.isBuiltIn);
		if (builtInProfiles.length > 0) {
			items.push({ type: 'separator', label: localize('builtInProfiles', "Built-in Profiles") });
			for (const profile of builtInProfiles) {
				const icon = ThemeIcon.fromString(`$(${profile.icon})`);
				items.push({
					label: profile.name,
					description: profile.id === activeProfileId ? localize('current', "Current") : undefined,
					detail: profile.description,
					iconClass: icon ? ThemeIcon.asClassName(icon) : undefined,
					profileId: profile.id
				});
			}
		}

		// Custom profiles
		const customProfiles = profiles.filter(p => !p.isBuiltIn);
		if (customProfiles.length > 0) {
			items.push({ type: 'separator', label: localize('customProfiles', "Custom Profiles") });
			for (const profile of customProfiles) {
				const icon = ThemeIcon.fromString(`$(${profile.icon})`);
				items.push({
					label: profile.name,
					description: profile.id === activeProfileId ? localize('current', "Current") : undefined,
					detail: profile.description,
					iconClass: icon ? ThemeIcon.asClassName(icon) : undefined,
					profileId: profile.id
				});
			}
		}

		// Additional actions
		items.push({ type: 'separator', label: localize('actions', "Actions") });
		items.push({
			label: localize('clearProfile', "$(clear-all) Clear Profile"),
			detail: localize('clearProfileDetail', "Return to manual configuration"),
			profileId: '__clear__'
		});

		const picked = await quickInputService.pick(items, {
			placeHolder: localize('selectProfile', "Select a lightweight mode profile"),
			matchOnDescription: true,
			matchOnDetail: true
		});

		if (picked && 'profileId' in picked) {
			try {
				if (picked.profileId === '__clear__') {
					await profileService.clearActiveProfile();
					notificationService.info(localize('profileCleared', "Lightweight mode profile cleared"));
				} else {
					await profileService.applyProfile(picked.profileId);
					const profile = profileService.getProfile(picked.profileId);
					if (profile) {
						notificationService.info(localize('profileApplied', "Applied profile: {0}", profile.name));
					}
				}
			} catch (error) {
				notificationService.error(localize('profileError', "Failed to apply profile: {0}", error instanceof Error ? error.message : 'Unknown error'));
			}
		}
	}
});

// Save Current Configuration as Profile Action
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.saveLightweightModeProfile',
			title: localize2('saveLightweightModeProfile', "Save Current as Profile"),
			category: Categories.View,
			f1: true
		});
	}

	async run(accessor: ServicesAccessor) {
		const profileService = accessor.get(ILightweightModeProfileService);
		const quickInputService = accessor.get(IQuickInputService);
		const notificationService = accessor.get(INotificationService);

		// Get profile name
		const name = await quickInputService.input({
			placeHolder: localize('profileName', "Enter profile name"),
			prompt: localize('profileNamePrompt', "Name for the new profile"),
			validateInput: async (value) => {
				if (!value || value.trim().length === 0) {
					return localize('nameRequired', "Profile name is required");
				}
				return undefined;
			}
		});

		if (!name) {
			return;
		}

		// Get profile description
		const description = await quickInputService.input({
			placeHolder: localize('profileDescription', "Enter profile description (optional)"),
			prompt: localize('profileDescriptionPrompt', "Description for the new profile")
		});

		try {
			const profile = await profileService.saveCurrentAsProfile(name, description || '');
			notificationService.info(localize('profileSaved', "Profile saved: {0}", profile.name));
		} catch (error) {
			notificationService.error(localize('saveError', "Failed to save profile: {0}", error instanceof Error ? error.message : 'Unknown error'));
		}
	}
});

// Delete Lightweight Mode Profile Action
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.deleteLightweightModeProfile',
			title: localize2('deleteLightweightModeProfile', "Delete Lightweight Mode Profile"),
			category: Categories.View,
			f1: true
		});
	}

	async run(accessor: ServicesAccessor) {
		const profileService = accessor.get(ILightweightModeProfileService);
		const quickInputService = accessor.get(IQuickInputService);
		const notificationService = accessor.get(INotificationService);

		const customProfiles = profileService.getCustomProfiles();
		if (customProfiles.length === 0) {
			notificationService.info(localize('noCustomProfiles', "No custom profiles to delete"));
			return;
		}

		interface ProfileQuickPickItem extends IQuickPickItem {
			profileId: string;
		}

		const items: ProfileQuickPickItem[] = customProfiles.map(profile => {
			const icon = ThemeIcon.fromString(`$(${profile.icon})`);
			return {
				label: profile.name,
				detail: profile.description,
				iconClass: icon ? ThemeIcon.asClassName(icon) : undefined,
				profileId: profile.id
			};
		});

		const picked = await quickInputService.pick(items, {
			placeHolder: localize('selectProfileToDelete', "Select profile to delete"),
			matchOnDescription: true,
			matchOnDetail: true
		});

		if (picked) {
			const confirmed = await quickInputService.pick([
				{ label: localize('yes', "Yes"), value: true },
				{ label: localize('no', "No"), value: false }
			], {
				placeHolder: localize('confirmDelete', "Delete profile '{0}'?", picked.label)
			});

			if (confirmed?.value) {
				const success = await profileService.deleteProfile(picked.profileId);
				if (success) {
					notificationService.info(localize('profileDeleted', "Profile deleted: {0}", picked.label));
				} else {
					notificationService.error(localize('deleteError', "Failed to delete profile"));
				}
			}
		}
	}
});

// Export Lightweight Mode Profile Action
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.exportLightweightModeProfile',
			title: localize2('exportLightweightModeProfile', "Export Lightweight Mode Profile"),
			category: Categories.View,
			f1: true
		});
	}

	async run(accessor: ServicesAccessor) {
		const profileService = accessor.get(ILightweightModeProfileService);
		const quickInputService = accessor.get(IQuickInputService);
		const notificationService = accessor.get(INotificationService);
		const fileDialogService = accessor.get(IFileDialogService);
		const fileService = accessor.get(IFileService);

		const profiles = profileService.getProfiles();

		interface ProfileQuickPickItem extends IQuickPickItem {
			profileId: string;
		}

		const items: ProfileQuickPickItem[] = profiles.map(profile => {
			const icon = ThemeIcon.fromString(`$(${profile.icon})`);
			return {
				label: profile.name,
				detail: profile.description,
				iconClass: icon ? ThemeIcon.asClassName(icon) : undefined,
				profileId: profile.id
			};
		});

		const picked = await quickInputService.pick(items, {
			placeHolder: localize('selectProfileToExport', "Select profile to export"),
			matchOnDescription: true,
			matchOnDetail: true
		});

		if (picked) {
			const json = profileService.exportProfile(picked.profileId);
			if (json) {
				const uri = await fileDialogService.showSaveDialog({
					title: localize('exportProfile', "Export Profile"),
					defaultUri: URI.file(`${picked.label.replace(/[^a-zA-Z0-9]/g, '-')}.json`),
					filters: [{ name: 'JSON', extensions: ['json'] }]
				});

				if (uri) {
					try {
						await fileService.writeFile(uri, VSBuffer.fromString(json));
						notificationService.info(localize('profileExported', "Profile exported: {0}", picked.label));
					} catch (error) {
						notificationService.error(localize('exportError', "Failed to export profile: {0}", error instanceof Error ? error.message : 'Unknown error'));
					}
				}
			}
		}
	}
});

// Import Lightweight Mode Profile Action
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.importLightweightModeProfile',
			title: localize2('importLightweightModeProfile', "Import Lightweight Mode Profile"),
			category: Categories.View,
			f1: true
		});
	}

	async run(accessor: ServicesAccessor) {
		const profileService = accessor.get(ILightweightModeProfileService);
		const notificationService = accessor.get(INotificationService);
		const fileDialogService = accessor.get(IFileDialogService);
		const fileService = accessor.get(IFileService);

		const uris = await fileDialogService.showOpenDialog({
			title: localize('importProfile', "Import Profile"),
			canSelectFiles: true,
			canSelectFolders: false,
			canSelectMany: false,
			filters: [{ name: 'JSON', extensions: ['json'] }]
		});

		if (uris && uris.length > 0) {
			try {
				const content = await fileService.readFile(uris[0]);
				const json = content.value.toString();
				const profile = await profileService.importProfile(json);
				notificationService.info(localize('profileImported', "Profile imported: {0}", profile.name));
			} catch (error) {
				notificationService.error(localize('importError', "Failed to import profile: {0}", error instanceof Error ? error.message : 'Unknown error'));
			}
		}
	}
});

// Open Lightweight Mode Walkthrough Action
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.openLightweightModeWalkthrough',
			title: localize2('openLightweightModeWalkthrough', "Open Lightweight Mode Walkthrough"),
			category: Categories.Help,
			f1: true
		});
	}

	async run(accessor: ServicesAccessor) {
		const commandService = accessor.get(ICommandService);
		await commandService.executeCommand(
			'workbench.action.openWalkthrough',
			'lightweightMode.walkthrough'
		);
	}
});

// Open Lightweight Mode Settings Action
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.openLightweightModeSettings',
			title: localize2('openLightweightModeSettings', "Open Lightweight Mode Settings"),
			category: Categories.Preferences,
			f1: true
		});
	}

	async run(accessor: ServicesAccessor) {
		const commandService = accessor.get(ICommandService);
		await commandService.executeCommand(
			'workbench.action.openSettings',
			'@id:workbench.lightweightMode'
		);
	}
});
