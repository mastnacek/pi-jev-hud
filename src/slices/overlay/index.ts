/**
 * Overlay slice for pi-jev-hud.
 * Provides functions to open and manage top-right modal and passive non-blocking monitoring HUD.
 */

import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { OverlayHandle, TUI } from "@earendil-works/pi-tui";
import type { PluginState } from "../../shared/state.js";
import type { HudTab } from "../../shared/types.js";
import { JevHudComponent, type JevHudComponentOptions } from "./hud-component.js";

export interface OpenOverlayOptions {
	initialTab?: HudTab;
	onRunTest?: () => Promise<void>;
}

let passiveOverlayHandle: OverlayHandle | null = null;
let passiveComponent: JevHudComponent | null = null;
let autoHideTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Opens the interactive Jev HUD modal in the top-right corner of the TUI.
 */
export async function openJevHudModal(
	ctx: ExtensionContext,
	state: PluginState,
	options?: OpenOverlayOptions,
): Promise<void> {
	if (!ctx.hasUI || ctx.mode !== "tui") {
		return;
	}

	// Hide any active passive monitor when opening interactive modal
	hidePassiveMonitoringHud();

	const componentOptions: JevHudComponentOptions = {
		initialTab: options?.initialTab,
		onRunTest: options?.onRunTest,
		isPassive: false,
	};

	try {
		await ctx.ui.custom(
			(tui, theme, _kb, done) => new JevHudComponent(tui, theme, state, done, componentOptions),
			{
				overlay: true,
				overlayOptions: {
					anchor: "top-right",
					width: 66,
					maxHeight: 20,
					margin: { top: 1, right: 2 },
				},
			},
		);
	} catch {
		// Non-fatal overlay dismiss
	}
}

/**
 * Displays or updates a non-blocking passive monitoring overlay in the top-right corner.
 * Does not steal focus or halt agent execution.
 */
export function updatePassiveMonitoringHud(
	tui: TUI,
	theme: any,
	state: PluginState,
	tab: HudTab = "decision",
	autoHideDurationMs = 8000,
): void {
	if (autoHideTimer) {
		clearTimeout(autoHideTimer);
		autoHideTimer = null;
	}

	if (!passiveOverlayHandle) {
		const currentFocus = (tui as any).getFocusedComponent ? (tui as any).getFocusedComponent() : null;

		passiveComponent = new JevHudComponent(tui, theme, state, undefined, {
			initialTab: tab,
			isPassive: true,
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
