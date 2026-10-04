/**
 * Slash commands for pi-jev-hud.
 * Provides /jev-hud with subcommands: show, test, auto, query, history, lang.
 */

import type { AutocompleteItem, ExtensionAPI, ExtensionCommandContext, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { PluginState } from "../../shared/state.js";
import type { HudTab, JevDecision } from "../../shared/types.js";
import { LOCALES, normalizeLocale, stringsFor } from "../../shared/i18n.js";

export type ShowOverlayFn = (ctx: ExtensionContext, tab?: HudTab) => Promise<void>;
export type RunTestFn = (ctx: ExtensionContext) => Promise<JevDecision>;

export function registerCommands(
	pi: ExtensionAPI,
	state: PluginState,
	showOverlay?: ShowOverlayFn,
	runTest?: RunTestFn,
): void {
	const initialStrings = stringsFor(state.lang);

	pi.registerCommand("jev-hud", {
		description: initialStrings.commandDescription,
		getArgumentCompletions: (args: string): AutocompleteItem[] => {
			const s = stringsFor(state.lang);
			const trimmed = args.trimStart();

			// Subcommand completions
			if (!trimmed || (!trimmed.includes(" ") && !"auto".startsWith(trimmed) && !"query".startsWith(trimmed) && !"lang".startsWith(trimmed))) {
				const items: AutocompleteItem[] = [
					{ value: "show", label: "show", description: s.showDesc },
					{ value: "test", label: "test", description: s.testDesc },
					{
						value: "auto ",
						label: "auto",
						description: s.autoDesc(state.autoPopup),
					},
					{
						value: "query ",
						label: "query",
						description: s.queryDesc(state.queryPopup),
					},
					{ value: "history", label: "history", description: s.historyDesc },
					{
						value: "lang ",
						label: "lang",
						description: s.langDesc(state.lang),
					},
				];
				return items.filter((it) => it.value.trim().startsWith(trimmed));
			}

			// Subcommand: auto [on|off]
			if (trimmed.startsWith("auto")) {
				return [
					{
						value: "auto on",
						label: state.autoPopup ? "✓ on" : "on",
						description: `Enable auto-popup on Jev decisions${state.autoPopup ? " · ● ACTIVE" : ""}`,
					},
					{
						value: "auto off",
						label: !state.autoPopup ? "✓ off" : "off",
						description: `Disable auto-popup on Jev decisions${!state.autoPopup ? " · ● ACTIVE" : ""}`,
					},
				];
			}

			// Subcommand: query [on|off]
			if (trimmed.startsWith("query")) {
				return [
					{
						value: "query on",
						label: state.queryPopup ? "✓ on" : "on",
						description: `Enable auto-popup on LLM queries${state.queryPopup ? " · ● ACTIVE" : ""}`,
					},
					{
						value: "query off",
						label: !state.queryPopup ? "✓ off" : "off",
						description: `Disable auto-popup on LLM queries${!state.queryPopup ? " · ● ACTIVE" : ""}`,
					},
				];
			}

			// Subcommand: lang [en|cs]
			if (trimmed.startsWith("lang")) {
				return LOCALES.map((loc) => ({
					value: `lang ${loc}`,
					label: state.lang === loc ? `✓ ${loc}` : loc,
					description: `Set UI language to ${loc.toUpperCase()}${state.lang === loc ? " · ● ACTIVE" : ""}`,
				}));
			}

			return [];
		},
		handler: async (args: string, ctx: ExtensionCommandContext) => {
			const s = stringsFor(state.lang);
			const [subcmd, ...rest] = args.trim().split(/\s+/);
			const sub = (subcmd || "show").toLowerCase();

			if (sub === "show") {
				if (showOverlay && ctx.hasUI && ctx.mode === "tui") {
					await showOverlay(ctx, "decision");
				} else {
					ctx.ui.notify(s.status(state.enabled), "info");
				}
				return;
			}

			if (sub === "test") {
				ctx.ui.notify(s.testInitiated, "info");
				if (runTest) {
					try {
						await runTest(ctx);
						ctx.ui.notify(s.testSuccess, "info");
						if (showOverlay && ctx.hasUI && ctx.mode === "tui") {
							await showOverlay(ctx, "decision");
						}
					} catch (err: any) {
						ctx.ui.notify(s.testError(err.message || String(err)), "error");
					}
				}
				return;
			}

			if (sub === "auto") {
				const param = rest[0]?.toLowerCase();
				if (param === "on") state.autoPopup = true;
				else if (param === "off") state.autoPopup = false;
				else state.autoPopup = !state.autoPopup;
				ctx.ui.notify(s.autoPopup(state.autoPopup), "info");
				return;
			}

			if (sub === "query") {
				const param = rest[0]?.toLowerCase();
				if (param === "on") state.queryPopup = true;
				else if (param === "off") state.queryPopup = false;
				else state.queryPopup = !state.queryPopup;
				ctx.ui.notify(s.queryPopup(state.queryPopup), "info");
				return;
			}

			if (sub === "lang") {
				const chosen = rest[0];
				if (chosen) {
					state.lang = normalizeLocale(chosen);
					ctx.ui.notify(s.langDesc(state.lang), "info");
				} else {
					ctx.ui.notify(s.langDesc(state.lang), "info");
				}
				return;
			}

			if (sub === "history") {
				if (state.decisionHistory.length === 0) {
					ctx.ui.notify(s.noDecisionsYet, "info");
				} else {
					const count = state.decisionHistory.length;
					const last = state.decisionHistory[0];
					ctx.ui.notify(`📜 ${count} decisions. Last: ${last?.model} (${last?.latencyMs}ms)`, "info");
				}
				return;
			}

			ctx.ui.notify(s.usageHelp, "info");
		},
	});
}
