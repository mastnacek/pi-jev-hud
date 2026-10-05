/**
 * Overlay slice for pi-jev-hud.
 * Provides functions to display and manage the non-blocking, display-only top-right HUD.
 */

import type { OverlayHandle, TUI } from "@earendil-works/pi-tui";
import type { PluginState } from "../../shared/state.js";
import type { HudTab } from "../../shared/types.js";
import { JevHudComponent } from "./hud-component.js";

let passiveOverlayHandle: OverlayHandle | null = null;
let passiveComponent: JevHudComponent | null = null;
let autoHideTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Displays or updates a non-blocking display-only overlay in the top-right corner.
 * Never captures focus or halts user input.
 */
export function updatePassiveMonitoringHud(
	tui: TUI,
	theme: any,
	state: PluginState,
	tab: HudTab = "decision",
	autoHideDurationMs = 10000,
): void {
	if (autoHideTimer) {
		clearTimeout(autoHideTimer);
		autoHideTimer = null;
	}

	if (!passiveOverlayHandle) {
		const currentFocus = (tui as any).getFocusedComponent ? (tui as any).getFocusedComponent() : null;

		passiveComponent = new JevHudComponent(tui, theme, state, {
			initialTab: tab,
		});

		passiveOverlayHandle = tui.showOverlay(passiveComponent, {
			anchor: "top-right",
			nonCapturing: true,
			width: 64,
			maxHeight: 18,
			margin: { top: 1, right: 2 },
		});

		if (currentFocus && (tui as any).setFocus) {
			(tui as any).setFocus(currentFocus);
		}
	} else if (passiveComponent) {
		passiveComponent.setTab(tab);
		tui.requestRender();
	}

	if (autoHideDurationMs > 0) {
		autoHideTimer = setTimeout(() => {
			hidePassiveMonitoringHud();
			tui.requestRender();
		}, autoHideDurationMs);
	}
}

/**
 * Hides the passive monitoring overlay.
 */
export function hidePassiveMonitoringHud(): void {
	if (autoHideTimer) {
		clearTimeout(autoHideTimer);
		autoHideTimer = null;
	}
	if (passiveOverlayHandle) {
		try {
			passiveOverlayHandle.hide();
		} catch {
			// ignore
		}
		passiveOverlayHandle = null;
		passiveComponent = null;
	}
}

/**
 * Checks whether the display HUD is currently visible.
 */
export function isHudVisible(): boolean {
	return passiveOverlayHandle !== null;
}
