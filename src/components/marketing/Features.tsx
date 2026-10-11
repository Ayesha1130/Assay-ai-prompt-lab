"use client";

import type { ReactNode } from "react";

import { useT } from "@/components/i18n/LanguageProvider";

const ICONS: Record<string, ReactNode> = {
  split: <path d="M6 3v6a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v6M6 3 3 6m3-3 3 3m9 12-3 3m3-3-3-3" />,
  check: <path d="m5 12 4 4L19 6" />,
  chart: <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />,
  cube: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12v9m0-9L4 7.5" />,
  clock: <path d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  bolt: <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />,
};

const FEATURES = [
  { key: "f1", icon: "split", span: "lg:col-span-4" },
  { key: "f2", icon: "check", span: "lg:col-span-2" },
  { key: "f3", icon: "chart", span: "lg:col-span-2" },
  { key: "f4", icon: "cube", span: "lg:col-span-4" },
  { key: "f5", icon: "clock", span: "lg:col-span-3" },
  { key: "f6", icon: "bolt", span: "lg:col-span-3" },
] as const;

export function Features() {
  const t = useT();

  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28">
      <h2 className="max-w-[20ch] text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
        {t("features.title")}
      </h2>
      <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-mute">{t("features.intro")}</p>

      <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {FEATURES.map((feature) => (
          <li
            key={feature.key}
            className={`group rounded-2xl border border-line bg-panel/60 p-6 transition-colors hover:border-accent/70 ${feature.span}`}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {ICONS[feature.icon]}
              </svg>
            </span>
            <h3 className="mt-5 text-xl font-bold tracking-tight">{t(`${feature.key}.title`)}</h3>
            <p className="mt-2 max-w-[46ch] leading-relaxed text-mute">{t(`${feature.key}.body`)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
