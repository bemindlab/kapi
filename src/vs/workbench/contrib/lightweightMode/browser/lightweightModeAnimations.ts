/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchLayoutService, Parts } from '../../../services/layout/browser/layoutService.js';
import { mainWindow } from '../../../../base/browser/window.js';

/**
 * Manages smooth animations for lightweight mode part visibility changes
 * with accessibility support for users who prefer reduced motion.
 */
export class LightweightModeAnimationController extends Disposable {

	private static readonly TRANSITION_DURATION = 200; // ms
	private static readonly TRANSITION_CLASS = 'lightweight-mode-transition';
	private static readonly HIDING_CLASS = 'lightweight-mode-hiding';

	private animationsEnabled: boolean;

	constructor(
		@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService
	) {
		super();

		// Check if user prefers reduced motion (accessibility)
		this.animationsEnabled = !mainWindow.matchMedia('(prefers-reduced-motion: reduce)').matches;

		// Listen for changes to motion preference
		const motionMediaQuery = mainWindow.matchMedia('(prefers-reduced-motion: reduce)');
		const motionChangeHandler = (e: MediaQueryListEvent) => {
			this.animationsEnabled = !e.matches;
		};
		motionMediaQuery.addEventListener('change', motionChangeHandler);
		this._register({
			dispose: () => motionMediaQuery.removeEventListener('change', motionChangeHandler)
		});
	}

	/**
	 * Animates the visibility change of a workbench part.
	 *
	 * @param part The workbench part to animate
	 * @param hide Whether to hide (true) or show (false) the part
	 * @returns A promise that resolves when the animation completes
	 */
	async animatePartVisibility(part: Parts, hide: boolean): Promise<void> {
		// Skip animation if user prefers reduced motion
		if (!this.animationsEnabled) {
			this.layoutService.setPartHidden(hide, part);
			return Promise.resolve();
		}

		// Get the DOM element for this part
		const element = this.layoutService.getContainer(mainWindow, part);
		if (!element) {
			// Part doesn't have a DOM element, apply change immediately
			this.layoutService.setPartHidden(hide, part);
			return Promise.resolve();
		}

		// Add transition class for CSS animations
		element.classList.add(LightweightModeAnimationController.TRANSITION_CLASS);

		if (hide) {
			// Add hiding class to trigger fade-out animation
			element.classList.add(LightweightModeAnimationController.HIDING_CLASS);

			// Wait for animation to complete, then actually hide the part
			return new Promise<void>(resolve => {
				setTimeout(() => {
					this.layoutService.setPartHidden(true, part);
					element.classList.remove(
						LightweightModeAnimationController.TRANSITION_CLASS,
						LightweightModeAnimationController.HIDING_CLASS
					);
					resolve();
				}, LightweightModeAnimationController.TRANSITION_DURATION);
			});
		} else {
			// First make the part visible
			this.layoutService.setPartHidden(false, part);

			// Force a reflow to ensure the transition is applied
			element.offsetHeight; // eslint-disable-line @typescript-eslint/no-unused-expressions

			// Wait for fade-in animation
			return new Promise<void>(resolve => {
				setTimeout(() => {
					element.classList.remove(LightweightModeAnimationController.TRANSITION_CLASS);
					resolve();
				}, LightweightModeAnimationController.TRANSITION_DURATION);
			});
		}
	}
}
