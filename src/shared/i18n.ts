/**
 * i18n kernel for pi-jev-hud.
 *
 * One table per locale, one lookup, no runtime dependency, no environment
 * sniffing. Add a locale by adding a row: `LOCALES` drives the command menu and
 * `stringsFor` drives the rendering, so nothing else has to change.
 */

export const LOCALES = ["en", "cs"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export interface CardStrings {
	title: string;
	commandDescription: string;
	ready: string;
	status: (enabled: boolean) => string;
	hudHeader: string;
	noDecisionsYet: string;
	noQueriesYet: string;
	tabDecision: string;
	tabQuery: string;
	tabHistory: string;
	tabConfig: string;
	targetModel: string;
	source: string;
	latency: string;
	cost: string;
	tokens: string;
	question: string;
	probabilities: string;
	confidence: string;
	stateSummary: string;
	keysHint: string;
	autoPopup: (active: boolean) => string;
	queryPopup: (active: boolean) => string;
	testInitiated: string;
	testSuccess: string;
	testError: (msg: string) => string;
	showDesc: string;
	hideDesc: string;
	toggleDesc: string;
	showDecisionDesc: string;
	showQueryDesc: string;
	showHistoryDesc: string;
	showConfigDesc: string;
	testDesc: string;
	autoDesc: (active: boolean) => string;
	queryDesc: (active: boolean) => string;
	historyDesc: string;
	langDesc: (lang: string) => string;
	usageHelp: string;
	done: string;
}

const STRINGS: Record<Locale, CardStrings> = {
	en: {
		title: "⚖️ JEV Decision & Query HUD",
		commandDescription: "Control the top-right Jev Decision & Query monitoring HUD",
		ready: "pi-jev-hud is ready.",
		status: (enabled) => `pi-jev-hud is ${enabled ? "enabled" : "muted"}.`,
		hudHeader: "⚖️ JEV MONITORING HUD",
		noDecisionsYet: "No Jev decisions recorded in this session yet.",
		noQueriesYet: "No LLM query events recorded yet.",
		tabDecision: "Decision",
		tabQuery: "Query",
		tabHistory: "History",
		tabConfig: "Config",
		targetModel: "🎯 Model:",
		source: "🔌 Source:",
		latency: "⚡ Latency:",
		cost: "🪙 Cost:",
		tokens: "🔢 Tokens:",
		question: "❓ Question:",
		probabilities: "📊 Probs:",
		confidence: "🔒 Confidence:",
		stateSummary: "📋 State Data:",
		keysHint: "⚡ Non-blocking display monitor",
		autoPopup: (active) => `Auto-display on decisions: ${active ? "🟢 ON" : "⚪ OFF"}`,
		queryPopup: (active) => `Auto-display on chat queries: ${active ? "🟢 ON" : "⚪ OFF"}`,
		testInitiated: "Running JEV test decision via OpenRouter...",
		testSuccess: "JEV decision completed successfully.",
		testError: (msg) => `JEV decision error: ${msg}`,
		showDesc: "Display the top-right HUD monitor",
		hideDesc: "Hide the top-right HUD monitor",
		toggleDesc: "Toggle display of the top-right HUD monitor",
		showDecisionDesc: "Display Decision view",
		showQueryDesc: "Display LLM Query view",
		showHistoryDesc: "Display History view",
		showConfigDesc: "Display Config view",
		testDesc: "Run a live JEV decision test via OpenRouter",
		autoDesc: (active) => `Toggle decision monitoring HUD (${active ? "✓ ON" : "OFF"})`,
		queryDesc: (active) => `Toggle LLM query monitoring HUD (${active ? "✓ ON" : "OFF"})`,
		historyDesc: "View recent decisions summary",
		langDesc: (lang) => `Switch UI language (current: ${lang.toUpperCase()})`,
		usageHelp: "Usage: /jev-hud [show | hide | toggle | test | auto on/off | query on/off | history | lang en/cs]",
		done: "Done.",
	},
	cs: {
		title: "⚖️ JEV Rozhodovací & Query HUD",
		commandDescription: "Ovládání monitorovacího HUD okna vpravo nahoře",
		ready: "pi-jev-hud je připraven.",
		status: (enabled) => `pi-jev-hud je ${enabled ? "zapnut" : "ztlumen"}.`,
		hudHeader: "⚖️ JEV MONITOROVACÍ HUD",
		noDecisionsYet: "V této relaci zatím neproběhlo žádné Jev rozhodování.",
		noQueriesYet: "Zatím nebyly zaznamenány žádné LLM dotazy.",
		tabDecision: "Rozhodnutí",
		tabQuery: "Dotaz",
		tabHistory: "Historie",
		tabConfig: "Nastavení",
		targetModel: "🎯 Model:",
		source: "🔌 Zdroj:",
		latency: "⚡ Odezva:",
		cost: "🪙 Cena:",
		tokens: "🔢 Tokeny:",
		question: "❓ Otázka:",
		probabilities: "📊 Pravděpodobnosti:",
		confidence: "🔒 Spolehlivost:",
		stateSummary: "📋 Vstupní data:",
		keysHint: "⚡ Pasivní monitorovací HUD",
		autoPopup: (active) => `Automatické zobrazení při rozhodování: ${active ? "🟢 ZAP" : "⚪ VYP"}`,
		queryPopup: (active) => `Automatické zobrazení při LLM dotazech: ${active ? "🟢 ZAP" : "⚪ VYP"}`,
		testInitiated: "Spouštím testovací JEV rozhodnutí přes OpenRouter...",
		testSuccess: "JEV rozhodnutí úspěšně dokončeno.",
		testError: (msg) => `Chyba JEV rozhodnutí: ${msg}`,
		showDesc: "Zobrazit monitorovací HUD vpravo nahoře",
		hideDesc: "Skrýt monitorovací HUD vpravo nahoře",
		toggleDesc: "Přepnout zobrazení monitorovacího HUD",
		showDecisionDesc: "Zobrazit přehled rozhodnutí",
		showQueryDesc: "Zobrazit přehled LLM dotazů",
		showHistoryDesc: "Zobrazit historii rozhodnutí",
		showConfigDesc: "Zobrazit nastavení",
		testDesc: "Spustit testovací JEV rozhodnutí přes OpenRouter",
		autoDesc: (active) => `Přepnout monitorování rozhodování (${active ? "✓ ZAP" : "VYP"})`,
		queryDesc: (active) => `Přepnout monitorování dotazů (${active ? "✓ ZAP" : "VYP"})`,
		historyDesc: "Zobrazit přehled nedávných rozhodnutí",
		langDesc: (lang) => `Změnit jazyk rozhraní (aktuálně: ${lang.toUpperCase()})`,
		usageHelp: "Použití: /jev-hud [show | hide | toggle | test | auto on/off | query on/off | history | lang en/cs]",
		done: "Hotovo.",
	},
};

/** The table for a locale; anything unknown falls back to the default. */
export function stringsFor(locale: string | undefined): CardStrings {
	return STRINGS[normalizeLocale(locale)];
}

/** Accept the obvious spellings; a typo is English, never a crash. */
export function normalizeLocale(raw: string | undefined): Locale {
	const token = (raw ?? "").trim().toLowerCase();
	if (token === "cs" || token === "cz" || token === "cze") return "cs";
	return DEFAULT_LOCALE;
}
