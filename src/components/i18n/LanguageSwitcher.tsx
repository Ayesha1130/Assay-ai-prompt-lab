"use client";

import { LANGUAGES } from "@/lib/i18n/translate";

import { useLanguage } from "./LanguageProvider";

/** Switches language instantly without reloading. Lists every language in LANGUAGES. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div role="group" aria-label={t("nav.language")} className={`inline-flex rounded-full border border-line p-0.5 ${className}`}>
      {LANGUAGES.map((option) => {
        const active = option.code === lang;
        return (
          <button
            key={option.code}
            type="button"
            lang={option.htmlLang}
            title={option.label}
            aria-pressed={active}
            onClick={() => setLang(option.code)}
            className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
              active ? "bg-raised text-fg" : "text-mute hover:text-fg"
            }`}
          >
            <span aria-hidden="true">{option.short}</span>
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
