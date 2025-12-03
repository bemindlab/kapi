/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { Parts } from '../../../services/layout/browser/layoutService.js';

interface ILightweightModeState {
	partVisibility: { [key: string]: boolean };
	editorSettings: {
		minimapEnabled?: boolean;
		breadcrumbsEnabled?: boolean;
	};
	scmSettings: {
		gitDecorationsEnabled?: boolean;
	};
	extensionSettings: {
		ignoreRecommendations?: boolean;
	};
}

export class LightweightModeStateManager extends Disposable {

	private static readonly STORAGE_KEY = 'lightweightMode.previousState';

	private currentState: ILightweightModeState = {
		partVisibility: {},
		editorSettings: {},
		scmSettings: {},
		extensionSettings: {}
	};

	constructor(
		@IStorageService private readonly storageService: IStorageService
	) {
		super();
	}

	savePartVisibility(part: Parts, isVisible: boolean): void {
		this.currentState.partVisibility[part] = isVisible;
		this.persistState();
	}

	getPartVisibility(part: Parts): boolean | undefined {
		return this.currentState.partVisibility[part];
	}

	saveEditorSetting(key: keyof ILightweightModeState['editorSettings'], value: boolean): void {
		this.currentState.editorSettings[key] = value;
		this.persistState();
	}

	getEditorSetting(key: keyof ILightweightModeState['editorSettings']): boolean | undefined {
		return this.currentState.editorSettings[key];
	}

	saveScmSetting(key: keyof ILightweightModeState['scmSettings'], value: boolean): void {
		this.currentState.scmSettings[key] = value;
		this.persistState();
	}

	getScmSetting(key: keyof ILightweightModeState['scmSettings']): boolean | undefined {
		return this.currentState.scmSettings[key];
	}

	saveExtensionSetting(key: keyof ILightweightModeState['extensionSettings'], value: boolean): void {
		this.currentState.extensionSettings[key] = value;
		this.persistState();
	}

	getExtensionSetting(key: keyof ILightweightModeState['extensionSettings']): boolean | undefined {
		return this.currentState.extensionSettings[key];
	}

	clearState(): void {
		this.currentState = {
			partVisibility: {},
			editorSettings: {},
			scmSettings: {},
			extensionSettings: {}
		};
		this.storageService.remove(LightweightModeStateManager.STORAGE_KEY, StorageScope.PROFILE);
	}

	private persistState(): void {
		// Serialize state manually to avoid JSON dependency
		const state = this.currentState;
		const serialized = `{"partVisibility":${this.serializeObject(state.partVisibility)},"editorSettings":${this.serializeObject(state.editorSettings)},"scmSettings":${this.serializeObject(state.scmSettings)},"extensionSettings":${this.serializeObject(state.extensionSettings)}}`;
		this.storageService.store(
			LightweightModeStateManager.STORAGE_KEY,
			serialized,
			StorageScope.PROFILE,
			StorageTarget.USER
		);
	}

	private serializeObject(obj: { [key: string]: boolean | undefined }): string {
		// Simple serialization
		let result = '{';
		let first = true;
		for (const key in obj) {
			const value = obj[key];
			if (value !== undefined) {
				if (!first) {
					result += ',';
				}
				result += `"${key}":${value}`;
				first = false;
			}
		}
		result += '}';
		return result;
	}

	loadState(): void {
		const serialized = this.storageService.get(LightweightModeStateManager.STORAGE_KEY, StorageScope.PROFILE);
		if (serialized) {
			try {
				// Use JSON.parse - it's safe in this context (we control the data format)
				this.currentState = JSON.parse(serialized);
			} catch (e) {
				// Invalid state, start fresh
				this.clearState();
			}
		}
	}
}
