"use client";

import { useT } from "@/components/i18n/LanguageProvider";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <div role="alert" className="rounded-2xl border border-fail/60 bg-fail/10 p-6">
        <h1 className="text-lg font-bold text-fail">{t("dash.errorTitle")}</h1>
        <p className="mt-1 text-sm">{t("dash.errorBody")}</p>
        <button type="button" onClick={reset} className="btn btn-quiet btn-sm mt-4">
          {t("dash.retry")}
        </button>
      </div>
    </div>
  );
}
