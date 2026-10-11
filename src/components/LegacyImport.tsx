"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useT } from "@/components/i18n/LanguageProvider";
import { importLegacyRuns, readLegacyRuns } from "@/lib/store";

/** Offers to move experiments the first version saved in this browser into the signed-in account. */
export function LegacyImport({ onImported }: { onImported?: () => void }) {
  const t = useT();
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => setCount(readLegacyRuns().length), []);

  if (count === 0 && !message) return null;

  const run = async () => {
    setBusy(true);
    const { imported, failed } = await importLegacyRuns();
    setBusy(false);
    setCount(failed);
    setMessage([t("legacy.done", { count: imported }), failed ? t("legacy.failed", { count: failed }) : ""].filter(Boolean).join(" "));
    if (imported > 0) {
      onImported?.();
      router.refresh();
    }
  };

  return (
    <div role="status" className="rounded-xl border border-accent/50 bg-accent/10 p-4">
      {message ? (
        <p className="text-sm">{message}</p>
      ) : (
        <>
          <p className="font-bold">{t("legacy.title")}</p>
          <p className="mt-1 text-sm text-mute">{t("legacy.body", { count })}</p>
        </>
      )}
      {count > 0 ? (
        <button type="button" onClick={run} disabled={busy} className="btn btn-primary btn-sm mt-3">
          {busy ? t("legacy.busy") : t("legacy.button", { count })}
        </button>
      ) : null}
    </div>
  );
}
