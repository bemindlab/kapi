/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize2 } from '../../../../nls.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { ILightweightModeService } from '../../../services/lightweightMode/common/lightweightMode.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { KeyMod, KeyCode } from '../../../../base/common/keyCodes.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';

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
