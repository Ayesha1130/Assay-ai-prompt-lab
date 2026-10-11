"use client";

import type { ReactNode } from "react";

import { useT } from "@/components/i18n/LanguageProvider";
import type { TKey } from "@/lib/i18n/translate";

/** The heading, short description and form area shared by every auth page. */
export function AuthPage({ titleKey, bodyKey, children }: { titleKey: TKey; bodyKey: TKey; children: ReactNode }) {
  const t = useT();
  return (
    <div className="rounded-2xl border border-line bg-panel/80 p-6 shadow-[0_30px_80px_-40px_rgba(84,87,232,0.6)] sm:p-8">
      <h1 className="text-balance text-3xl font-extrabold leading-[1.08] tracking-[-0.03em]">{t(titleKey)}</h1>
      <p className="mt-3 leading-relaxed text-mute">{t(bodyKey)}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}
