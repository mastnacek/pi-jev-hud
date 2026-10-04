/**
 * TUI Overlay HUD Component for JEV Decisions and LLM Queries.
 * Width-safe rendering with box drawing, theme styling, and emoji badges.
 */

import type { Component, TUI } from "@earendil-works/pi-tui";
import { matchesKey, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import type { PluginState } from "../../shared/state.js";
import type { HudTab } from "../../shared/types.js";
import { stringsFor } from "../../shared/i18n.js";

export function fitLineToWidth(line: string, maxWidth: number, ellipsis = "…"): string {
	if (maxWidth <= 0) return "";
	const vWidth = visibleWidth(line);
	if (vWidth <= maxWidth) return line;
	return truncateToWidth(line, maxWidth, ellipsis);
}

function renderProgressBar(ratio: number, length = 8): string {
	const clamped = Math.max(0, Math.min(1, ratio));
	const filled = Math.round(clamped * length);
	return "█".repeat(filled) + "░".repeat(length - filled);
}

export interface JevHudComponentOptions {
	initialTab?: HudTab;
	onRunTest?: () => Promise<void>;
	isPassive?: boolean;
}

export class JevHudComponent implements Component {
	private activeTab: HudTab = "decision";
	private state: PluginState;
	private theme: any;
	private tui: TUI;
	private done?: (result?: any) => void;
	private onRunTest?: () => Promise<void>;
	private testRunning = false;
	private testStatusMessage = "";
	public isPassive = false;

	constructor(
		tui: TUI,
		theme: any,
		state: PluginState,
		done?: (result?: any) => void,
		options?: JevHudComponentOptions,
	) {
		this.tui = tui;
		this.theme = theme;
		this.state = state;
		this.done = done;
		if (options?.initialTab) {
			this.activeTab = options.initialTab;
		}
		this.onRunTest = options?.onRunTest;
		this.isPassive = options?.isPassive ?? false;
	}

	public setTab(tab: HudTab): void {
		this.activeTab = tab;
		this.tui.requestRender();
	}

	public handleInput(data: string): boolean {
		if (this.isPassive) return false;

		if (matchesKey(data, "escape") || matchesKey(data, "q")) {
			this.done?.();
			return true;
		}

		if (matchesKey(data, "tab") || matchesKey(data, "right")) {
			const tabs: HudTab[] = ["decision", "query", "history", "config"];
			const idx = tabs.indexOf(this.activeTab);
			this.activeTab = tabs[(idx + 1) % tabs.length]!;
			this.tui.requestRender();
			return true;
		}

		if (matchesKey(data, "left")) {
			const tabs: HudTab[] = ["decision", "query", "history", "config"];
			const idx = tabs.indexOf(this.activeTab);
			this.activeTab = tabs[(idx - 1 + tabs.length) % tabs.length]!;
			this.tui.requestRender();
			return true;
		}

		if (data === "1" || data === "2" || data === "3" || data === "4") {
			const tabs: HudTab[] = ["decision", "query", "history", "config"];
			this.activeTab = tabs[Number(data) - 1]!;
			this.tui.requestRender();
			return true;
		}

		if (data.toLowerCase() === "a") {
			this.state.autoPopup = !this.state.autoPopup;
			this.tui.requestRender();
			return true;
		}

		if (data.toLowerCase() === "p") {
			this.state.queryPopup = !this.state.queryPopup;
			this.tui.requestRender();
			return true;
		}

		if (data.toLowerCase() === "t" && this.onRunTest && !this.testRunning) {
			this.testRunning = true;
			this.testStatusMessage = stringsFor(this.state.lang).testInitiated;
			this.tui.requestRender();
			this.onRunTest()
				.then(() => {
					this.testRunning = false;
					this.testStatusMessage = stringsFor(this.state.lang).testSuccess;
					this.activeTab = "decision";
					this.tui.requestRender();
				})
				.catch((err) => {
					this.testRunning = false;
					this.testStatusMessage = stringsFor(this.state.lang).testError(err.message || String(err));
					this.tui.requestRender();
				});
			return true;
		}

		return false;
	}

	public render(width: number): string[] {
		const s = stringsFor(this.state.lang);
		const th = this.theme;
		const innerWidth = Math.max(28, width - 2);

		const pad = (text: string, len: number) => {
			const vlen = visibleWidth(text);
			if (vlen >= len) return truncateToWidth(text, len, "…");
			return text + " ".repeat(len - vlen);
		};

		const row = (content: string) => {
			const border = th?.fg ? th.fg("accent", "│") : "│";
			return `${border}${pad(` ${content} `, innerWidth)}${border}`;
		};

		const lines: string[] = [];
		const topTitle = this.isPassive ? ` ⚖️ JEV MONITOR [Top-Right] ` : ` ⚖️ JEV HUD [Top-Right] `;
		const leftTop = th?.fg ? th.fg("accent", "┌─") : "┌─";
		const rightTop = th?.fg ? th.fg("accent", "┐") : "┐";
		const titleStyled = th?.style ? th.style(topTitle, { bold: true, fg: "accent" }) : topTitle;
		const borderRemainder = Math.max(0, innerWidth - visibleWidth(topTitle) - 2);
		lines.push(fitLineToWidth(`${leftTop}${titleStyled}${"─".repeat(borderRemainder)}${rightTop}`, width));

		const tabLabels: { key: HudTab; label: string; num: string }[] = [
			{ key: "decision", label: s.tabDecision, num: "1" },
			{ key: "query", label: s.tabQuery, num: "2" },
			{ key: "history", label: s.tabHistory, num: "3" },
			{ key: "config", label: s.tabConfig, num: "4" },
		];

		const renderedTabs = tabLabels
			.map((t) => {
				const isCurrent = this.activeTab === t.key;
				const labelText = `[${t.num}.${t.label}]`;
				if (isCurrent) {
					return th?.style ? th.style(labelText, { bold: true, fg: "success", bg: "toolSuccessBg" }) : `*${labelText}*`;
				}
				return th?.fg ? th.fg("dim", labelText) : labelText;
			})
			.join(" ");
		lines.push(fitLineToWidth(row(renderedTabs), width));

		const divBorder = (th?.fg ? th.fg("accent", "├") : "├") + "─".repeat(innerWidth) + (th?.fg ? th.fg("accent", "┤") : "┤");
		lines.push(fitLineToWidth(divBorder, width));

		if (this.activeTab === "decision") this.renderDecisionTab(lines, row, width, s, th);
		else if (this.activeTab === "query") this.renderQueryTab(lines, row, width, s, th);
		else if (this.activeTab === "history") this.renderHistoryTab(lines, row, width, s, th);
		else if (this.activeTab === "config") this.renderConfigTab(lines, row, width, s, th);

		if (this.testStatusMessage) lines.push(fitLineToWidth(row(this.testStatusMessage), width));

		lines.push(fitLineToWidth(divBorder, width));
		const footerText = this.isPassive
			? th?.fg ? th.fg("dim", "⚡ Non-blocking monitor (active in background)") : "⚡ Non-blocking monitor"
			: th?.fg ? th.fg("dim", s.keysHint) : s.keysHint;
		lines.push(fitLineToWidth(row(footerText), width));

		const botBorder = (th?.fg ? th.fg("accent", "└") : "└") + "─".repeat(innerWidth) + (th?.fg ? th.fg("accent", "┘") : "┘");
		lines.push(fitLineToWidth(botBorder, width));
		return lines;
	}

	private renderDecisionTab(lines: string[], row: (c: string) => string, width: number, s: any, th: any): void {
		const dec = this.state.lastDecision;
		if (!dec) {
			lines.push(fitLineToWidth(row(th?.fg ? th.fg("dim", s.noDecisionsYet) : s.noDecisionsYet), width));
			lines.push(fitLineToWidth(row("💡 Monitoring active. Waiting for decisions..."), width));
			return;
		}

		const modelStr = `${s.targetModel} ${th?.style ? th.style(dec.model, { bold: true }) : dec.model}`;
		const latStr = `${s.latency} ${dec.latencyMs}ms`;
		const costStr = dec.costUsd !== undefined ? `${s.cost} $${dec.costUsd.toFixed(6)}` : "";
		lines.push(fitLineToWidth(row(`${modelStr} ${latStr} ${costStr}`), width));

		const stateKeys = Object.keys(dec.state);
		if (stateKeys.length > 0) {
			const summary = stateKeys.map((k) => `${k}: ${JSON.stringify(dec.state[k])}`).join(" | ");
			lines.push(fitLineToWidth(row(`${s.stateSummary} ${th?.fg ? th.fg("dim", summary) : summary}`), width));
		}

		const qKeys = Object.keys(dec.answers || {});
		for (const qKey of qKeys) {
			const ans = dec.answers[qKey];
			if (!ans) continue;

			let badge = "";
			let bar = "";
			if (ans.type === "bool") {
				const isTrue = ans.value === true || (typeof ans.probability === "number" && ans.probability >= 0.5);
				const prob = ans.probability ?? (isTrue ? 1 : 0);
				badge = th?.style ? th.style(isTrue ? "⚠️ TRUE" : "✅ FALSE", { bold: true, fg: isTrue ? "warning" : "success" }) : (isTrue ? "TRUE" : "FALSE");
				bar = `[${renderProgressBar(prob)}] ${(prob * 100).toFixed(0)}%`;
			} else if (ans.type === "choice") {
				const choice = String(ans.choice || ans.value || "");
				const conf = ans.confidence ?? 0.8;
				const isRisk = choice.toLowerCase().includes("risk") || choice.toLowerCase().includes("crit");
				badge = th?.style ? th.style(`🎯 ${choice.toUpperCase()}`, { bold: true, fg: isRisk ? "error" : "accent" }) : `🎯 ${choice}`;
				bar = `[${renderProgressBar(conf)}] ${(conf * 100).toFixed(0)}% conf`;
			} else if (ans.type === "score") {
				badge = th?.style ? th.style(`🔢 SCORE ${ans.score ?? ans.value ?? 0}`, { bold: true, fg: "accent" }) : `SCORE ${ans.score}`;
			} else {
				badge = JSON.stringify(ans);
			}

			lines.push(fitLineToWidth(row(`❓ ${th?.style ? th.style(qKey, { bold: true }) : qKey} ➔ ${badge} ${bar}`), width));
		}
	}

	private renderQueryTab(lines: string[], row: (c: string) => string, width: number, s: any, th: any): void {
		const query = this.state.lastQuery;
		if (!query) {
			lines.push(fitLineToWidth(row(th?.fg ? th.fg("dim", s.noQueriesYet) : s.noQueriesYet), width));
			return;
		}
		lines.push(fitLineToWidth(row(`🎯 Provider: ${query.provider} | Model: ${query.model}`), width));
		if (query.latencyMs) lines.push(fitLineToWidth(row(`⚡ Latency: ${query.latencyMs}ms | Status: ${query.status ?? "completed"}`), width));
		lines.push(fitLineToWidth(row(`📝 Prompt: ${th?.fg ? th.fg("dim", query.promptSnippet) : query.promptSnippet}`), width));
	}

	private renderHistoryTab(lines: string[], row: (c: string) => string, width: number, s: any, th: any): void {
		if (this.state.decisionHistory.length === 0) {
			lines.push(fitLineToWidth(row(th?.fg ? th.fg("dim", s.noDecisionsYet) : s.noDecisionsYet), width));
			return;
		}
		lines.push(fitLineToWidth(row(`📜 Recent Decisions (${this.state.decisionHistory.length}):`), width));
		this.state.decisionHistory.slice(0, 5).forEach((item, i) => {
			const timeStr = new Date(item.timestamp).toLocaleTimeString();
			const qSummary = Object.keys(item.answers || {})
				.map((k) => `${k}: ${item.answers[k]?.choice || item.answers[k]?.value || JSON.stringify(item.answers[k])}`)
				.join(", ");
			lines.push(fitLineToWidth(row(`${i + 1}. [${timeStr}] ${item.model} ➔ ${qSummary}`), width));
		});
	}

	private renderConfigTab(lines: string[], row: (c: string) => string, width: number, s: any, th: any): void {
		lines.push(fitLineToWidth(row(`⚙️ HUD Settings & Controls:`), width));
		lines.push(fitLineToWidth(row(`[A] ${s.autoPopup(this.state.autoPopup)}`), width));
		lines.push(fitLineToWidth(row(`[P] ${s.queryPopup(this.state.queryPopup)}`), width));
		lines.push(fitLineToWidth(row(`[T] Run test JEV classification`), width));
		lines.push(fitLineToWidth(row(`🌐 Current language: ${this.state.lang.toUpperCase()} (/jev-hud lang [en|cs])`), width));
	}
}
