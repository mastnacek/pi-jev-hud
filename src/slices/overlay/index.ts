/**
 * Overlay slice for pi-jev-hud.
 * Provides functions to open and manage the top-left floating modal HUD.
 */

import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { PluginState } from "../../shared/state.js";
import type { HudTab } from "../../shared/types.js";
import { JevHudComponent, type JevHudComponentOptions } from "./hud-component.js";

export interface OpenOverlayOptions {
	initialTab?: HudTab;
	onRunTest?: () => Promise<void>;
}

/**
 * Opens the Jev HUD modal in the top-left corner of the TUI.
 */
export async function openJevHudModal(
	ctx: ExtensionContext,
	state: PluginState,
	options?: OpenOverlayOptions,
): Promise<void> {
	// Guard: only show TUI overlays in TUI mode
	if (!ctx.hasUI || ctx.mode !== "tui") {
		return;
	}

	const componentOptions: JevHudComponentOptions = {
		initialTab: options?.initialTab,
		onRunTest: options?.onRunTest,
	};

	try {
		await ctx.ui.custom(
			(tui, theme, _kb, done) => new JevHudComponent(tui, theme, state, done, componentOptions),
			{
				overlay: true,
				overlayOptions: {
					anchor: "top-left",
					width: 68,
					maxHeight: 22,
					margin: { top: 1, left: 2 },
				},
			},
		);
	} catch (error) {
		// Non-fatal overlay dismiss
	}
}
