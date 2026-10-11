import type { Metadata } from "next";
import { Suspense } from "react";

import { LabClient } from "@/components/LabClient";
import { getServerT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Demo" };

/** Open to everyone. Uses only the simulated model, saves nothing, and never calls a paid API. */
export default async function DemoPage() {
  const t = await getServerT();
  return (
    <>
      <div className="mx-auto max-w-[88rem] px-5 pt-10 sm:px-8">
        <h1 className="sr-only">{t("demo.title")}</h1>
        <p className="max-w-[60ch] rounded-xl border border-line bg-panel/70 px-4 py-3 text-sm text-mute">
          <span className="font-bold text-fg">{t("demo.title")}.</span> {t("demo.body")}
        </p>
      </div>
      <Suspense fallback={<div className="mx-auto max-w-6xl px-5 py-12 text-mute sm:px-8">…</div>}>
        <LabClient mode="demo" />
      </Suspense>
    </>
  );
}
