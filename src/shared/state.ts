/**
 * Shared state kernel for pi-jev-hud.
 * Shared across slices; slices never import each other directly.
 */

import { DEFAULT_LOCALE, type Locale } from "./i18n.js";
import type { JevDecision, QueryEvent } from "./types.js";

export interface PluginState {
	enabled: boolean;
	/** UI language; every user-facing string resolves through the i18n table. */
	lang: Locale;
	/** Auto pop up the top-left HUD whenever Jev makes a decision. */
	autoPopup: boolean;
	/** Auto pop up on LLM queries. */
	queryPopup: boolean;
	lastRunTimestamp: number;
	lastDecision: JevDecision | null;
	decisionHistory: JevDecision[];
	lastQuery: QueryEvent | null;
	queryHistory: QueryEvent[];
}

export function createInitialState(): PluginState {
	return {
		enabled: true,
		lang: DEFAULT_LOCALE,
		autoPopup: true,
		queryPopup: false,
		lastRunTimestamp: 0,
		lastDecision: null,
		decisionHistory: [],
		lastQuery: null,
		queryHistory: [],
	};
}

export function recordDecision(state: PluginState, decision: JevDecision): void {
	state.lastDecision = decision;
	state.decisionHistory.unshift(decision);
	if (state.decisionHistory.length > 50) {
		state.decisionHistory.pop();
	}
	state.lastRunTimestamp = decision.timestamp;
}

export function recordQuery(state: PluginState, query: QueryEvent): void {
	state.lastQuery = query;
	state.queryHistory.unshift(query);
	if (state.queryHistory.length > 50) {
		state.queryHistory.pop();
	}
}
