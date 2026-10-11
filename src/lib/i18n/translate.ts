import { en } from "./en.ts";
import { ru } from "./ru.ts";
import type { Dict, TKey, Vars } from "./types.ts";

export type { Dict, TKey, Vars } from "./types.ts";

/**
 * To add a language: create a dictionary file like ru.ts, import it here, and add one line
 * to LANGUAGES and one to DICTIONARIES. The switcher and the tests pick it up automatically.
 */
export const LANGUAGES = [
  { code: "en", label: "English", short: "EN", htmlLang: "en" },
  { code: "ru", label: "Roman Urdu", short: "RU", htmlLang: "ur-Latn" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANG: Lang = "en";
export const LANG_COOKIE = "assay-lang";
export const LANG_STORAGE_KEY = "assay.lang";

const DICTIONARIES: Record<Lang, Dict> = { en, ru };

export function isLang(value: unknown): value is Lang {
  return LANGUAGES.some((l) => l.code === value);
}

export function htmlLangFor(lang: Lang): string {
  return LANGUAGES.find((l) => l.code === lang)?.htmlLang ?? "en";
}

/** Looks a key up in the chosen language, falls back to English, and fills in {placeholders}. */
export function translate(lang: Lang, key: TKey, vars?: Vars): string {
  const raw = DICTIONARIES[lang]?.[key] ?? en[key];
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export function dictionaryFor(lang: Lang): Dict {
  return DICTIONARIES[lang];
}
