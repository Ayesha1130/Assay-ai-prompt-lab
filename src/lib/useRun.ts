"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CaseResult, RunEvent, RunRequest } from "./engine/types";

export type RunStatus = "idle" | "running" | "done" | "cancelled" | "error";

/** Starts a run on the server and collects its results as they stream in. */
export function useRun() {
  const [status, setStatus] = useState<RunStatus>("idle");
  const [results, setResults] = useState<CaseResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const start = useCallback(async (request: RunRequest): Promise<CaseResult[] | null> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setStatus("running");
    setResults([]);
    setError(null);

    const collected: CaseResult[] = [];
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `The run could not start (status ${res.status}).`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newline = buffer.indexOf("\n");
        while (newline >= 0) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          newline = buffer.indexOf("\n");
          if (!line) continue;

          const event = JSON.parse(line) as RunEvent;
          if (event.type === "result") {
            collected.push(event.result);
            setResults([...collected]);
          } else if (event.type === "error") {
            throw new Error(event.message);
          } else {
            finished = true;
          }
        }
      }

      if (!finished) throw new Error("The connection closed before the run finished.");
      setStatus("done");
      return collected;
    } catch (err) {
      if (controller.signal.aborted) {
        setStatus(collected.length > 0 ? "cancelled" : "idle");
        return null;
      }
      setError(err instanceof Error ? err.message : "The run failed.");
      setStatus("error");
      return null;
    }
  }, []);

  const cancel = useCallback(() => controllerRef.current?.abort(), []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setStatus("idle");
    setResults([]);
    setError(null);
  }, []);

  return { status, results, error, start, cancel, reset };
}
