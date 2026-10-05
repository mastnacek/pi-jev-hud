import test from "node:test";
import assert from "node:assert/strict";
import { visibleWidth } from "@earendil-works/pi-tui";
import { createInitialState, recordDecision, recordQuery } from "../src/shared/state.js";
import { fitLineToWidth } from "../src/slices/overlay/hud-component.js";
import type { JevDecision, QueryEvent } from "../src/shared/types.js";

test("state kernel records decisions correctly", () => {
	const state = createInitialState();
	assert.equal(state.decisionHistory.length, 0);
	assert.equal(state.autoPopup, false);

	const sampleDecision: JevDecision = {
		id: "dec_1",
		timestamp: 1700000000000,
		model: "openrouter/typesafe/jev-1.13",
		provider: "openrouter",
		state: { command: "rm -rf /tmp/cache" },
		questions: { isRisky: "Risk check" },
		answers: {
			isRisky: {
				type: "bool",
				value: true,
				probability: 0.85,
			},
		},
		latencyMs: 320,
		tokensUsed: 420,
		costUsd: 0.000015,
		source: "tool",
	};

	recordDecision(state, sampleDecision);

	assert.equal(state.decisionHistory.length, 1);
	assert.equal(state.lastDecision?.id, "dec_1");
	assert.equal(state.lastRunTimestamp, 1700000000000);
});

test("state kernel records query events correctly", () => {
	const state = createInitialState();
	assert.equal(state.queryHistory.length, 0);

	const query: QueryEvent = {
		id: "q_1",
		timestamp: 1700000001000,
		provider: "openrouter",
		model: "moonshot/kimi-k3",
		promptSnippet: "Explain how this works",
		status: "pending",
	};

	recordQuery(state, query);

	assert.equal(state.queryHistory.length, 1);
	assert.equal(state.lastQuery?.id, "q_1");
});

test("fitLineToWidth truncates wide lines safely without throwing", () => {
	const text = "A".repeat(100);
	const fitted = fitLineToWidth(text, 30);
	assert.ok(visibleWidth(fitted) <= 30);
	assert.equal(fitLineToWidth("", 10), "");
	assert.equal(fitLineToWidth("Short", 20), "Short");
});
