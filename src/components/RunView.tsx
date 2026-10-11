"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { experimentName } from "@/lib/dashboard";
import type { SavedRun } from "@/lib/engine/types";
import { when } from "@/lib/format";
import { ApiError, deleteRun, getRun, renameRun } from "@/lib/store";

import { ResultsPanel } from "./ResultsPanel";

export function RunView({ id }: { id: string }) {
  const router = useRouter();
  // undefined while loading, null when no run has this id (or it belongs to someone else)
  const [run, setRun] = useState<SavedRun | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    setLoadError(null);
    getRun(id)
      .then((r) => {
        if (!live) return;
        setRun(r);
        if (r) setName(experimentName(r));
      })
      .catch((err: unknown) => live && setLoadError(err instanceof Error ? err.message : "The run could not be loaded."));
    return () => {
      live = false;
    };
  }, [id]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <div role="alert" className="rounded-xl border border-fail/60 bg-fail/10 p-6">
          <h1 className="text-xl font-bold">This run could not be loaded</h1>
          <p className="mt-1 text-sm">{loadError}</p>
          <Link href="/runs" className="btn btn-quiet btn-sm mt-4">
            Back to history
          </Link>
        </div>
      </div>
    );
  }

  if (run === undefined) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8" aria-busy="true" aria-label="Loading the run">
        <div className="skeleton h-8 w-1/3 rounded" />
        <div className="skeleton mt-6 h-72 rounded-xl" />
      </div>
    );
  }

  if (run === null) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em]">Run not found</h1>
        <p className="mt-2 text-mute">It may have been deleted, or it does not belong to your account.</p>
        <Link href="/runs" className="btn btn-quiet mt-6">
          Back to history
        </Link>
      </div>
    );
  }

  const rename = async (event: FormEvent) => {
    event.preventDefault();
    const next = name.trim();
    if (!next || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const updated = await renameRun(run.id, next);
      setRun(updated);
      setName(experimentName(updated));
      setMessage({ tone: "ok", text: "Name saved." });
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof ApiError ? err.message : "The name could not be saved." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await deleteRun(run.id);
      router.push("/runs");
    } catch {
      setBusy(false);
      setMessage({ tone: "error", text: "This run could not be deleted. Try again." });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
      <p className="text-sm text-mute">
        <Link href="/runs" className="underline underline-offset-4 hover:text-fg">
          History
        </Link>{" "}
        / {when(run.createdAt)}
      </p>

      <form onSubmit={rename} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="run-name" className="mb-1.5 block text-sm font-semibold">
            Experiment name
          </label>
          <input id="run-name" className="field" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-quiet" disabled={busy || !name.trim()}>
          Save name
        </button>
      </form>
      {message ? (
        <p role={message.tone === "error" ? "alert" : "status"} className={`mt-2 text-sm ${message.tone === "error" ? "text-fail" : "text-mute"}`}>
          {message.text}
        </p>
      ) : null}

      <div className="mt-8">
        <ResultsPanel request={run.request} results={run.results} status="done" />
      </div>
      <div className="mt-10 flex flex-wrap gap-3 border-t border-line/70 pt-6">
        <Link href={`/lab?from=${run.id}`} className="btn btn-primary">
          Edit and run again
        </Link>
        <button type="button" className="btn btn-quiet" onClick={remove} disabled={busy}>
          Delete this run
        </button>
      </div>
    </div>
  );
}
