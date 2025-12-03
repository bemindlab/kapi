/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { Event } from '../../../../base/common/event.js';
import { ILightweightModeConfiguration } from './lightweightMode.js';

export const ILightweightModeProfileService = createDecorator<ILightweightModeProfileService>('lightweightModeProfileService');

/**
 * Represents a lightweight mode profile configuration preset.
 */
export interface ILightweightModeProfile {
	/** Unique identifier for the profile */
	id: string;

	/** Display name of the profile */
	name: string;

	/** Description of what the profile does */
	description: string;

	/** Icon identifier (Codicon name) */
	icon: string;

	/** The actual configuration settings */
	configuration: ILightweightModeConfiguration;

	/** Whether this is a built-in profile (cannot be deleted) */
	isBuiltIn: boolean;

	/** Timestamp when custom profile was created */
	createdAt?: number;
}

/**
 * Built-in profile IDs
 */
export const enum BuiltInProfileId {
	UltraMinimal = 'ultra-minimal',
	FocusedCoding = 'focused-coding',
	AIPairProgramming = 'ai-pair-programming',
	PresentationMode = 'presentation-mode'
}

/**
 * Service for managing lightweight mode profiles.
 */
export interface ILightweightModeProfileService {
	readonly _serviceBrand: undefined;

	/**
	 * Emits when the active profile changes.
	 */
	readonly onDidChangeActiveProfile: Event<string | undefined>;

	/**
	 * Emits when the list of available profiles changes.
	 */
	readonly onDidChangeProfiles: Event<void>;

	/**
	 * Gets all available profiles (built-in + custom).
	 */
	getProfiles(): ILightweightModeProfile[];

	/**
	 * Gets a specific profile by ID.
	 */
	getProfile(id: string): ILightweightModeProfile | undefined;

	/**
	 * Gets the currently active profile ID.
	 */
	getActiveProfileId(): string | undefined;

	/**
	 * Applies a profile's configuration.
	 */
	applyProfile(profileId: string): Promise<void>;

	/**
	 * Saves the current configuration as a custom profile.
	 */
	saveCurrentAsProfile(name: string, description: string): Promise<ILightweightModeProfile>;

	/**
	 * Deletes a custom profile (cannot delete built-in profiles).
	 */
	deleteProfile(profileId: string): Promise<boolean>;

	/**
	 * Exports a profile to JSON string.
	 */
	exportProfile(profileId: string): string | undefined;

	/**
	 * Imports a profile from JSON string.
	 */
	importProfile(json: string): Promise<ILightweightModeProfile>;

	/**
	 * Gets all built-in profiles.
	 */
	getBuiltInProfiles(): ILightweightModeProfile[];

	/**
	 * Gets all custom profiles.
	 */
	getCustomProfiles(): ILightweightModeProfile[];

	/**
	 * Clears the active profile (returns to manual configuration).
	 */
	clearActiveProfile(): Promise<void>;
}
