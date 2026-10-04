/**
 * Tools slice for pi-jev-hud.
 * Registers `jev_decide` tool allowing direct structured classification with automatic top-left HUD modal.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { PluginState } from "../../shared/state.js";
import { recordDecision } from "../../shared/state.js";
import type { HudTab, JevDecision } from "../../shared/types.js";

export type ShowOverlayFn = (ctx: ExtensionContext, tab?: HudTab) => Promise<void>;

const JevDecideSchema = Type.Object({
	state: Type.Object(
		{},
		{
			additionalProperties: true,
			description: "JSON state object describing the action, data, code, or context to classify.",
		},
	),
	questions: Type.Object(
		{},
		{
			additionalProperties: true,
			description:
				"Map of question ID to classification question object ({ type: 'bool' | 'choice' | 'score', instructions: string, criteria: object | array }).",
		},
	),
	model: Type.Optional(
		Type.String({
			description: "Optional classifier model slug, defaults to 'typesafe/jev-1.13' on OpenRouter.",
		}),
	),
});

export function registerTools(
	pi: ExtensionAPI,
	state: PluginState,
	showOverlay?: ShowOverlayFn,
): void {
	pi.registerTool({
		name: "jev_decide",
		description:
			"Evaluate structured decisions, risk assessment, and categorical classifications using the Jev System One classifier on OpenRouter. Results are automatically displayed in the top-left HUD modal.",
		parameters: JevDecideSchema,
		handler: async (args: any, ctx: ExtensionContext) => {
			const startTime = Date.now();
			const modelSlug = args.model || "typesafe/jev-1.13";
			const provider = modelSlug.includes("/") ? modelSlug.split("/")[0] : "openrouter";
			const modelId = modelSlug.includes("/") ? modelSlug.slice(provider.length + 1) : modelSlug;

			// Find classifier model in registry
			let classifierModel = ctx.modelRegistry.findOfType("classifier", provider, modelId);
			if (!classifierModel) {
				classifierModel = ctx.modelRegistry.findOfType("classifier", "openrouter", "typesafe/jev-1.13");
			}
			if (!classifierModel) {
				classifierModel = ctx.modelRegistry.findOfType("classifier", "openrouter", "~typesafe/jev-latest");
			}
			if (!classifierModel) {
				const avail = await ctx.modelRegistry.getAvailableOfType("classifier");
				if (avail.length > 0) {
					classifierModel = avail[0];
				}
			}

			if (!classifierModel) {
				throw new Error("No classifier model available. Please check OpenRouter authentication in /login.");
			}

			const result = await ctx.modelRegistry.classify(classifierModel, {
				state: args.state,
				questions: args.questions,
			});

			const latencyMs = Date.now() - startTime;
			const tokensUsed = result.usage?.totalTokens;
			const costUsd = result.usage?.cost?.total;

			const decision: JevDecision = {
				id: `dec_${Date.now()}`,
				timestamp: Date.now(),
				model: `${classifierModel.provider}/${classifierModel.id}`,
				provider: classifierModel.provider,
				state: args.state,
				questions: args.questions,
				answers: result.answers,
				latencyMs,
				tokensUsed,
				costUsd,
				source: "tool",
			};

			recordDecision(state, decision);

			// Automatically pop up top-left HUD if enabled and in TUI mode
			if (state.autoPopup && ctx.hasUI && ctx.mode === "tui" && showOverlay) {
				showOverlay(ctx, "decision").catch(() => {});
			}

			if (result.stopReason !== "stop") {
				return {
					isError: true,
					content: [{ type: "text", text: `Jev classification failed: ${result.errorMessage || result.stopReason}` }],
					details: decision,
				};
			}

			const summaryLines = Object.entries(result.answers).map(([key, val]: [string, any]) => {
				const ansStr = val.choice ?? val.score ?? (val.type === "bool" ? (val.value ? "true" : "false") : JSON.stringify(val));
				const confStr = val.confidence !== undefined ? ` (conf: ${(val.confidence * 100).toFixed(0)}%)` : "";
				return `• ${key}: ${ansStr}${confStr}`;
			});

			return {
				content: [
					{
						type: "text",
						text: `Jev decision evaluated (${latencyMs}ms, ${tokensUsed ?? 0} tokens):\n${summaryLines.join("\n")}`,
					},
				],
				details: decision,
			};
		},
	});
}
