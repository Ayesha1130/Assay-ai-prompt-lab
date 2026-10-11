"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  LANG_COOKIE,
  LANG_STORAGE_KEY,
  htmlLangFor,
  isLang,
  translate,
  type Lang,
  type TKey,
  type Vars,
} from "@/lib/i18n/translate";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TKey, vars?: Vars) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Remembers the choice in localStorage and in a cookie, so the server can render it on the next visit. */
function persist(lang: Lang) {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Storage is blocked. The cookie still works.
  }
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = htmlLangFor(lang);
}

interface Props {
  /** The language the server rendered with, so the first client render matches it exactly. */
  initial: Lang;
  /** Whether that came from the saved cookie rather than the default. */
  fromCookie: boolean;
  children: ReactNode;
}

export function LanguageProvider({ initial, fromCookie, children }: Props) {
  const [lang, setLangState] = useState<Lang>(initial);

  useEffect(() => {
    // After hydration only. If this device has a saved choice but no cookie yet, adopt it once.
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (!fromCookie && isLang(saved) && saved !== initial) {
        setLangState(saved);
        persist(saved);
      } else if (fromCookie && saved !== initial) {
        window.localStorage.setItem(LANG_STORAGE_KEY, initial);
      }
    } catch {
      // Storage is blocked. Nothing to reconcile.
    }
  }, [initial, fromCookie]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    persist(next);
  }, []);

  const t = useCallback((key: TKey, vars?: Vars) => translate(lang, key, vars), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}

export function useT() {
  return useLanguage().t;
}
