/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Telemetry event classifications for lightweight mode
 * These define the GDPR-compliant data that can be collected
 */

/**
 * Event fired when lightweight mode is toggled on or off
 */
export type LightweightModeToggledClassification = {
	owner: 'vscode';
	comment: 'Tracks when users toggle lightweight mode on or off';
	enabled: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Whether lightweight mode was enabled or disabled' };
	from: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'How the toggle was initiated (e.g., command, keybinding, configuration)' };
	sessionCount: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Number of times mode has been toggled in this session' };
};

export type LightweightModeToggledEvent = {
	enabled: boolean;
	from: string;
	sessionCount: number;
};

/**
 * Event fired when a lightweight mode session ends (mode disabled or window closed)
 */
export type LightweightModeSessionDurationClassification = {
	owner: 'vscode';
	comment: 'Tracks how long users keep lightweight mode enabled';
	durationMs: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Duration of the lightweight mode session in milliseconds' };
	toggleCount: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Number of times the mode was toggled during this session' };
	configChanges: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Number of configuration changes during this session' };
};

export type LightweightModeSessionDurationEvent = {
	durationMs: number;
	toggleCount: number;
	configChanges: number;
};

/**
 * Event fired when a lightweight mode configuration setting is changed
 */
export type LightweightModeConfigChangedClassification = {
	owner: 'vscode';
	comment: 'Tracks which lightweight mode settings users customize';
	settingKey: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'The configuration key that was changed (e.g., hideActivityBar)' };
	newValue: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'The type of the new value (boolean, string, array)' };
	isEnabled: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Whether lightweight mode is currently enabled' };
};

export type LightweightModeConfigChangedEvent = {
	settingKey: string;
	newValue: string;
	isEnabled: boolean;
};

/**
 * Event fired when lightweight mode is first toggled after installation
 */
export type LightweightModeFirstToggleClassification = {
	owner: 'vscode';
	comment: 'Tracks how long after installation users first try lightweight mode';
	timeToFirstToggleMs: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Time from first session to first toggle in milliseconds' };
	enabledOnFirstToggle: { classification: 'SystemMetaData'; purpose: 'FeatureInsight'; comment: 'Whether the first toggle enabled or disabled the mode' };
};

export type LightweightModeFirstToggleEvent = {
	timeToFirstToggleMs: number;
	enabledOnFirstToggle: boolean;
};
