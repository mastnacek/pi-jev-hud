import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_LOCALE, LOCALES, normalizeLocale, stringsFor } from "../src/shared/i18n.js";

test("every locale has a complete string table", () => {
	for (const locale of LOCALES) {
		const s = stringsFor(locale);
		for (const key of ["title", "commandDescription", "ready", "done", "showDesc", "testDesc", "historyDesc", "usageHelp"] as const) {
			assert.equal(typeof s[key], "string", `${locale}.${key} must be a string`);
			assert.ok(s[key].trim().length > 0, `${locale}.${key} must not be empty`);
		}
		assert.equal(typeof s.status(true), "string");
		assert.equal(typeof s.autoPopup(true), "string");
		assert.equal(typeof s.queryPopup(true), "string");
	}
});

test("an unknown locale is English, never a crash", () => {
	assert.equal(normalizeLocale("klingon"), "en");
	assert.equal(normalizeLocale(undefined), "en");
	assert.equal(stringsFor("nonsense").title, stringsFor("en").title);
});

test("the default locale is the one the scaffold ships", () => {
	assert.ok(stringsFor(DEFAULT_LOCALE).title.includes("JEV"));
	assert.equal(DEFAULT_LOCALE, "en");
});
