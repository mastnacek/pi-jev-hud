/**
 * Shared types for pi-jev-hud.
 */

export type HudTab = "decision" | "query" | "history" | "config";

export interface JevQuestionResult {
	type: "bool" | "choice" | "score";
	value: boolean | string | number;
	confidence?: number;
	probabilities?: Record<string, number>;
	probability?: number;
	instructions?: string;
}

export interface JevDecision {
	id: string;
	timestamp: number;
	model: string;
	provider: string;
	state: Record<string, unknown>;
	questions: Record<string, unknown>;
	answers: Record<string, JevQuestionResult | any>;
	latencyMs: number;
	tokensUsed?: number;
	costUsd?: number;
	source: "codemode" | "tool" | "api";
}

export interface QueryEvent {
	id: string;
	timestamp: number;
	provider: string;
	model: string;
	promptSnippet: string;
	latencyMs?: number;
	status?: "pending" | "completed" | "error";
	error?: string;
}
