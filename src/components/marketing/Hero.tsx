"use client";

import Link from "next/link";

import { useT } from "@/components/i18n/LanguageProvider";

import { ProductPreview } from "./ProductPreview";

export function Hero() {
  const t = useT();

  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="hero-grid absolute inset-0" />
        <div className="hero-glow-a -left-24 top-0 h-80 w-80 sm:h-[26rem] sm:w-[26rem]" />
        <div className="hero-glow-b -right-16 top-24 h-72 w-72 sm:h-96 sm:w-96" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.02fr_1fr] lg:gap-14 lg:pb-28 lg:pt-24">
        <div>
          <h1 className="settle text-balance text-[clamp(2.5rem,5.6vw,4.75rem)] font-extrabold leading-[1.02] tracking-[-0.035em]">
            {t("hero.title")}
          </h1>
          <p className="settle-late mt-6 max-w-[34rem] text-lg leading-relaxed text-mute">{t("hero.subtitle")}</p>
          <div className="settle-late mt-9 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="btn btn-primary">
              {t("hero.primary")}
            </Link>
            <Link href="/demo" className="btn btn-quiet bg-bg/40 backdrop-blur-sm">
              {t("hero.secondary")}
            </Link>
          </div>
        </div>

        <div className="settle-late">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
