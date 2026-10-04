/**
 * Lifecycle pipeline listeners for pi-jev-hud.
 * Intercepts tool executions and provider queries to update the top-right monitoring HUD non-blockingly.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { PluginState } from "../../shared/state.js";
import { recordDecision, recordQuery } from "../../shared/state.js";
import type { HudTab, JevDecision, QueryEvent } from "../../shared/types.js";

export type ShowPassiveFn = (tab?: HudTab) => void;

export function registerPipelineListeners(
	pi: ExtensionAPI,
	state: PluginState,
	track: (fn: () => void) => void,
	showPassive?: ShowPassiveFn,
): void {
	const pendingQueries = new Map<string, { startTime: number; model: string; provider: string }>();

	// Track before provider request (primary chat model querying)
	track(
		pi.on("before_provider_request", async (event) => {
			const queryId = `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
			const model = (event as any)?.model?.id ?? (event as any)?.modelId ?? "unknown";
			const provider = (event as any)?.model?.provider ?? (event as any)?.provider ?? "unknown";

			let promptSnippet = "";
			try {
				const msgs = (event as any)?.messages ?? [];
				const lastMsg = msgs[msgs.length - 1];
				if (typeof lastMsg?.content === "string") {
					promptSnippet = lastMsg.content.slice(0, 100);
				} else if (Array.isArray(lastMsg?.content)) {
					promptSnippet = lastMsg.content
						.filter((b: any) => b.type === "text")
						.map((b: any) => b.text)
						.join(" ")
						.slice(0, 100);
				}
			} catch {
				promptSnippet = "Chat turn request";
			}

			pendingQueries.set(queryId, { startTime: Date.now(), model, provider });

			const queryItem: QueryEvent = {
				id: queryId,
				timestamp: Date.now(),
				provider,
				model,
				promptSnippet: promptSnippet || "Chat query initiated",
				status: "pending",
			};

			recordQuery(state, queryItem);

			if (state.queryPopup && showPassive) {
				showPassive("query");
			}
		}),
	);

	// Track after provider response
	track(
		pi.on("after_provider_response", async () => {
			if (state.lastQuery && state.lastQuery.status === "pending") {
				state.lastQuery.status = "completed";
				state.lastQuery.latencyMs = Date.now() - state.lastQuery.timestamp;
				if (state.queryPopup && showPassive) {
					showPassive("query");
				}
			}
		}),
	);

	// Intercept tool results (codemode running classify)
	track(
		pi.on("tool_result", async (event) => {
			if (event.toolName === "codemode") {
				try {
					const code = typeof event.input === "object" && event.input && "code" in event.input ? String(event.input.code) : "";
					if (code.includes("models.classify") || code.includes("jev")) {
						const outputStr = typeof event.result === "string" ? event.result : JSON.stringify(event.result);
						const decision: JevDecision = {
							id: `dec_${Date.now()}`,
							timestamp: Date.now(),
							model: "openrouter/typesafe/jev-1.13",
							provider: "openrouter",
							state: { snippet: code.slice(0, 80) },
							questions: { evaluation: "Script evaluation" },
							answers: {
								summary: {
									type: "choice",
									value: outputStr.slice(0, 120),
									confidence: 0.9,
								},
							},
							latencyMs: 350,
							source: "codemode",
						};

						recordDecision(state, decision);

						if (state.autoPopup && showPassive) {
							showPassive("decision");
						}
					}
				} catch {
					// Ignore parse errors
				}
			}
		}),
	);
}
