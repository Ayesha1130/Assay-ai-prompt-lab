"use client";

import Link from "next/link";

import { useT } from "@/components/i18n/LanguageProvider";

export function FinalCta() {
  const t = useT();

  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="relative isolate overflow-hidden rounded-3xl border border-line bg-panel px-6 py-14 text-center sm:px-12 sm:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(124,77,240,0.28),transparent_70%)]" />
        <h2 className="mx-auto max-w-[22ch] text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          {t("cta.title")}
        </h2>
        <p className="mx-auto mt-5 max-w-[46ch] text-lg leading-relaxed text-mute">{t("cta.body")}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="btn btn-primary">
            {t("cta.primary")}
          </Link>
          <Link href="/demo" className="btn btn-quiet">
            {t("cta.secondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
