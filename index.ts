/**
 * pi-jev-hud — Pi coding agent extension.
 *
 * Composition root: wires slices, provides top-right non-blocking monitoring
 * display overlay, and drains listeners on session_shutdown.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { Component, TUI } from "@earendil-works/pi-tui";
import { createInitialState, recordDecision } from "./src/shared/state.js";
import type { HudTab, JevDecision } from "./src/shared/types.js";
import { hidePassiveMonitoringHud, updatePassiveMonitoringHud } from "./src/slices/overlay/index.js";
import { registerCommands } from "./src/slices/commands/index.js";
import { registerTools } from "./src/slices/tools/index.js";
import { registerPipelineListeners } from "./src/slices/pipeline/index.js";

/** Subagent recursion guard: avoid duplicating hooks in child sessions. */
function isDelegatedSession(): boolean {
	return process.env.PI_SUBAGENT === "true" || Boolean(process.env.PI_CHILD_SESSION);
}

/**
 * Empty component used only as a vehicle to obtain the TUI/theme references.
 * `setWidget` renders its factory result inside a Container, so returning
 * `undefined` makes `Container.render` call `.render()` on undefined and
 * hard-crashes the TUI.
 */
class NoopWidgetComponent implements Component {
	render(_width: number): string[] {
		return [];
	}

	invalidate(): void {
		// no cached state
	}
}

export default function (pi: ExtensionAPI): void {
	if (isDelegatedSession()) {
		return;
	}

	const state = createInitialState();
	const unsubscribers: Array<() => void> = [];
	const track = (result: unknown): void => {
		if (typeof result === "function") unsubscribers.push(result as () => void);
	};

	let activeTui: TUI | null = null;
	let activeTheme: any = null;

	const runTest = async (ctx: ExtensionContext): Promise<JevDecision> => {
		const startTime = Date.now();
		let jev = ctx.modelRegistry.findOfType("classifier", "openrouter", "typesafe/jev-1.13");
		if (!jev) {
			jev = ctx.modelRegistry.findOfType("classifier", "openrouter", "~typesafe/jev-latest");
		}
		if (!jev) {
			const avail = await ctx.modelRegistry.getAvailableOfType("classifier");
			if (avail.length > 0) jev = avail[0];
		}

		if (!jev) {
			throw new Error("No classifier model found in registry.");
		}

		const result = await ctx.modelRegistry.classify(jev, {
			state: {
				sampleAction: "git push --force origin main",
				riskLevel: "high",
				initiator: "developer",
			},
			questions: {
				isDestructive: {
					type: "bool",
					instructions: "Is this action destructive or hazardous?",
					criteria: { true: "Destructive action", false: "Safe action" },
				},
				severity: {
					type: "choice",
					instructions: "Classify operational severity level",
					criteria: {
						low: "Low risk maintenance",
						medium: "Moderate operational impact",
						critical: "Critical destructive impact",
					},
				},
			},
		});

		const latencyMs = Date.now() - startTime;
		const decision: JevDecision = {
			id: `test_${Date.now()}`,
			timestamp: Date.now(),
			model: `${jev.provider}/${jev.id}`,
			provider: jev.provider,
			state: { action: "git push --force origin main" },
			questions: { isDestructive: "Destructive check", severity: "Severity level" },
			answers: result.answers,
			latencyMs,
			tokensUsed: result.usage?.totalTokens,
			costUsd: result.usage?.cost?.total,
			source: "api",
		};

		recordDecision(state, decision);
		return decision;
	};

	const showPassive = (tab: HudTab = "decision"): void => {
		if (activeTui && activeTheme && state.enabled) {
			updatePassiveMonitoringHud(activeTui, activeTheme, state, tab);
		}
	};

	const hidePassive = (): void => {
		hidePassiveMonitoringHud();
	};

	// Track session start and grab TUI / theme references for non-blocking overlay
	track(
		pi.on("session_start", async (_event, ctx) => {
			if (ctx.hasUI && ctx.mode === "tui") {
				ctx.ui.setWidget("jev-hud-bridge", (tui, theme) => {
					activeTui = tui;
					activeTheme = theme;
					return new NoopWidgetComponent();
				});
			}
		}),
	);

	// Wire slices
	registerCommands(pi, state, showPassive, hidePassive, runTest);
	registerTools(pi, state, showPassive);
	registerPipelineListeners(pi, state, track, showPassive);

	// Drain all listeners on session shutdown
	pi.on("session_shutdown", async () => {
		hidePassiveMonitoringHud();
		while (unsubscribers.length > 0) {
			unsubscribers.pop()?.();
		}
	});
}
