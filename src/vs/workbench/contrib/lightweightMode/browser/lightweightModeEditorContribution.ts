/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { ILightweightModeService } from '../../../services/lightweightMode/common/lightweightMode.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';

export class LightweightModeEditorContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.lightweightModeEditor';

	private previousMinimapEnabled: boolean | undefined;
	private previousBreadcrumbsEnabled: boolean | undefined;

	constructor(
		@ILightweightModeService private readonly lightweightModeService: ILightweightModeService,
		@IConfigurationService private readonly configurationService: IConfigurationService
	) {
		super();

		// Apply initial state
		if (this.lightweightModeService.isEnabled()) {
			this.applyEditorSettings();
		}

		// Listen for mode changes
		this._register(this.lightweightModeService.onDidChangeLightweightMode(enabled => {
			if (enabled) {
				this.applyEditorSettings();
			} else {
				this.restoreEditorSettings();
			}
		}));

		// Listen for configuration changes while mode is active
		this._register(this.configurationService.onDidChangeConfiguration(e => {
			if (this.lightweightModeService.isEnabled() &&
				e.affectsConfiguration('workbench.lightweightMode')) {
				this.applyEditorSettings();
			}
		}));
	}

	private applyEditorSettings(): void {
		const config = this.lightweightModeService.getConfiguration();

		// Hide minimap if configured
		if (config.hideMinimap) {
			this.previousMinimapEnabled = this.configurationService.getValue<boolean>('editor.minimap.enabled');
			if (this.previousMinimapEnabled !== false) {
				this.configurationService.updateValue('editor.minimap.enabled', false);
			}
		}

		// Hide breadcrumbs if configured
		if (config.hideBreadcrumbs) {
			this.previousBreadcrumbsEnabled = this.configurationService.getValue<boolean>('breadcrumbs.enabled');
			if (this.previousBreadcrumbsEnabled !== false) {
				this.configurationService.updateValue('breadcrumbs.enabled', false);
			}
		}
	}

	private restoreEditorSettings(): void {
		// Restore minimap setting
		if (this.previousMinimapEnabled !== undefined) {
			this.configurationService.updateValue('editor.minimap.enabled', this.previousMinimapEnabled);
			this.previousMinimapEnabled = undefined;
		}

		// Restore breadcrumbs setting
		if (this.previousBreadcrumbsEnabled !== undefined) {
			this.configurationService.updateValue('breadcrumbs.enabled', this.previousBreadcrumbsEnabled);
			this.previousBreadcrumbsEnabled = undefined;
		}
	}
}
