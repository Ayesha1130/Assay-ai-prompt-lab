"use client";

import { useT } from "@/components/i18n/LanguageProvider";

const STEPS = ["how.s1", "how.s2", "how.s3"] as const;

export function HowItWorks() {
  const t = useT();

  return (
    <section id="how-it-works" className="scroll-mt-20 border-y border-line/70 bg-panel/40">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <h2 className="max-w-[22ch] text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          {t("how.title")}
        </h2>

        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, index) => (
            <li key={step} className="relative">
              {index < STEPS.length - 1 ? (
                <span aria-hidden="true" className="absolute left-14 top-5 hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r from-line to-transparent md:block" />
              ) : null}
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-base font-extrabold text-white">
                {index + 1}
              </span>
              <p className="mt-5 text-sm font-semibold text-mute">{t("how.step", { n: index + 1 })}</p>
              <h3 className="mt-1 text-2xl font-bold tracking-tight">{t(`${step}.title`)}</h3>
              <p className="mt-3 max-w-[30ch] leading-relaxed text-mute">{t(`${step}.body`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
