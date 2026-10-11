"use client";

import { useT } from "@/components/i18n/LanguageProvider";

export function SkipLink() {
  const t = useT();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-bg"
    >
      {t("nav.skip")}
    </a>
  );
}
