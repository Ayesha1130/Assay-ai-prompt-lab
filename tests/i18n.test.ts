import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { en } from "../src/lib/i18n/en.ts";
import {
  DEFAULT_LANG,
  LANGUAGES,
  dictionaryFor,
  htmlLangFor,
  isLang,
  translate,
  type Lang,
} from "../src/lib/i18n/translate.ts";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const URDU_SCRIPT = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

describe("translation dictionaries", () => {
  it("defaults to English", () => {
    assert.equal(DEFAULT_LANG, "en");
    assert.equal(LANGUAGES[0].code, "en");
  });

  for (const lang of LANGUAGES.map((l) => l.code) as Lang[]) {
    const dict = dictionaryFor(lang);

    it(`${lang} has exactly the same keys as English`, () => {
      assert.deepEqual(Object.keys(dict).sort(), Object.keys(en).sort());
    });

    it(`${lang} has no empty strings`, () => {
      for (const [key, value] of Object.entries(dict)) assert.ok(value.trim().length > 0, key);
    });

    it(`${lang} keeps the same {placeholders} as English`, () => {
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        assert.deepEqual(placeholders(dict[key]), placeholders(en[key]), key);
      }
    });

    it(`${lang} uses Latin characters only, never Urdu script`, () => {
      for (const [key, value] of Object.entries(dict)) assert.ok(!URDU_SCRIPT.test(value), key);
    });
  }

  it("Roman Urdu really differs from English for the main page copy", () => {
    const ru = dictionaryFor("ru");
    for (const key of ["hero.title", "hero.subtitle", "cta.title", "cta.body", "how.s1.body", "f1.body", "login.title"] as const) {
      assert.notEqual(ru[key], en[key], key);
    }
  });
});

describe("translate", () => {
  it("looks up and fills in placeholders", () => {
    assert.equal(translate("en", "dash.welcome", { name: "Sara" }), "Welcome back, Sara");
    assert.equal(translate("ru", "dash.welcome", { name: "Sara" }), "Wapas khush aamdeed, Sara");
    assert.equal(translate("en", "preview.winner", { side: "B", points: 50 }), "Prompt B wins by 50 points");
  });

  it("leaves unknown placeholders visible instead of crashing", () => {
    assert.equal(translate("en", "dash.welcome", {}), "Welcome back, {name}");
    assert.equal(translate("en", "dash.welcome"), "Welcome back, {name}");
  });

  it("falls back to English for an unknown language at runtime", () => {
    assert.equal(translate("xx" as Lang, "nav.features"), "Features");
  });

  it("matches the example sentences from the product brief", () => {
    assert.equal(translate("en", "footer.tagline"), "Test smarter prompts, save time, and improve AI performance.");
    assert.equal(
      translate("ru", "footer.tagline"),
      "Behtar AI prompts test karein, apna waqt bachayein, aur AI ki performance improve karein.",
    );
  });
});

describe("language helpers", () => {
  it("recognises only supported languages", () => {
    assert.equal(isLang("en"), true);
    assert.equal(isLang("ru"), true);
    assert.equal(isLang("fr"), false);
    assert.equal(isLang(null), false);
    assert.equal(isLang(undefined), false);
  });

  it("labels Roman Urdu with a Latin-script language tag", () => {
    assert.equal(htmlLangFor("en"), "en");
    assert.equal(htmlLangFor("ru"), "ur-Latn");
  });
});
