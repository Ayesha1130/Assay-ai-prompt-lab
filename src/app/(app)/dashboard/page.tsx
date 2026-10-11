import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { LegacyImport } from "@/components/LegacyImport";
import { RUN_COLUMNS, type RunRow } from "@/lib/api-helpers";
import { experimentName, summarizeExperiment, summarizeExperiments, type ExperimentStatus } from "@/lib/dashboard";
import { pct } from "@/lib/format";
import { getServerT } from "@/lib/i18n/server";
import type { TKey } from "@/lib/i18n/translate";
import { loadProfile } from "@/lib/profile";
import { SIDE_STYLE } from "@/lib/side";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const STATUS_KEY: Record<ExperimentStatus, TKey> = {
  A: "dash.statusA",
  B: "dash.statusB",
  tie: "dash.statusTie",
  incomplete: "dash.statusIncomplete",
};

const STATUS_TONE: Record<ExperimentStatus, string> = {
  A: SIDE_STYLE.A.text,
  B: SIDE_STYLE.B.text,
  tie: "text-fg",
  incomplete: "text-fail",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel/70 p-5">
      <dt className="text-sm font-semibold text-mute">{label}</dt>
      <dd className="mt-2 text-3xl font-extrabold leading-tight tracking-[-0.03em]">{value}</dd>
      {hint ? <p className="mt-1 text-xs text-mute">{hint}</p> : null}
    </div>
  );
}

export default async function DashboardPage() {
  const { supabase, user } = await getUser();
  if (!supabase || !user) redirect("/login");

  const t = await getServerT();
  // Row level security means these queries can only ever return this user's own rows.
  const [profile, count, recent] = await Promise.all([
    loadProfile(supabase, user),
    supabase.from("runs").select("id", { count: "exact", head: true }),
    supabase.from("runs").select(RUN_COLUMNS).order("created_at", { ascending: false }).limit(100),
  ]);

  const failed = Boolean(count.error || recent.error);
  const rows = ((recent.data ?? []) as unknown as RunRow[]).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    request: row.request,
    results: row.results,
  }));
  const total = count.count ?? rows.length;
  const stats = summarizeExperiments(rows);
  const latest = rows[0];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
      <header>
        <h1 className="text-balance text-3xl font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-4xl">
          {t("dash.welcome", { name: profile.displayName })}
        </h1>
        <p className="mt-2 text-lg text-mute">{t("dash.subtitle")}</p>
      </header>

      <div className="mt-6">
        <LegacyImport />
      </div>

      {failed ? (
        <div role="alert" className="mt-8 rounded-2xl border border-fail/60 bg-fail/10 p-6">
          <h2 className="text-lg font-bold text-fail">{t("dash.errorTitle")}</h2>
          <p className="mt-1 text-sm">{t("dash.errorBody")}</p>
          <Link href="/dashboard" className="btn btn-quiet btn-sm mt-4">
            {t("dash.retry")}
          </Link>
        </div>
      ) : total === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-panel/40 px-6 py-14 text-center">
          <h2 className="mx-auto max-w-[24ch] text-balance text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">{t("dash.emptyTitle")}</h2>
          <p className="mx-auto mt-3 max-w-[44ch] text-mute">{t("dash.emptyBody")}</p>
          <Link href="/lab" className="btn btn-primary mt-7">
            {t("dash.emptyCta")}
          </Link>
        </div>
      ) : (
        <>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t("dash.total")} value={total} />
            <Stat label={t("dash.completed")} value={stats.completed} hint={t("dash.completedHint")} />
            <Stat
              label={t("dash.avgPass")}
              value={stats.avgPassRate === null ? "-" : pct(stats.avgPassRate)}
              hint={total > rows.length ? t("dash.latestOf", { count: rows.length }) : t("dash.avgPassHint")}
            />
            <Stat
              label={t("dash.latest")}
              value={<span className="line-clamp-2 text-xl">{latest ? experimentName(latest) : t("dash.noneYet")}</span>}
              hint={latest ? formatDate(latest.createdAt) : undefined}
            />
          </dl>

          <section className="mt-12" aria-labelledby="recent-heading">
            <h2 id="recent-heading" className="text-xl font-extrabold tracking-tight">
              {t("dash.recent")}
            </h2>

            <div className="mt-4 hidden grid-cols-[minmax(0,1.6fr)_7rem_5rem_5rem_9rem_7rem] gap-4 px-4 pb-2 text-xs font-semibold text-mute md:grid" aria-hidden="true">
              <span>{t("dash.colName")}</span>
              <span>{t("dash.colDate")}</span>
              <span>{t("dash.colA")}</span>
              <span>{t("dash.colB")}</span>
              <span>{t("dash.colStatus")}</span>
              <span />
            </div>

            <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-panel/50">
              {rows.slice(0, 8).map((run) => {
                const s = summarizeExperiment(run);
                return (
                  <li
                    key={run.id}
                    className="grid gap-x-4 gap-y-1 px-4 py-4 md:grid-cols-[minmax(0,1.6fr)_7rem_5rem_5rem_9rem_7rem] md:items-center"
                  >
                    <span className="min-w-0 truncate font-semibold">{experimentName(run)}</span>
                    <span className="text-sm text-mute">{formatDate(run.createdAt)}</span>
                    <span className={`text-sm font-bold ${SIDE_STYLE.A.text}`}>
                      <span className="font-normal text-mute md:sr-only">{t("dash.colA")} </span>
                      {pct(s.a)}
                    </span>
                    <span className={`text-sm font-bold ${SIDE_STYLE.B.text}`}>
                      <span className="font-normal text-mute md:sr-only">{t("dash.colB")} </span>
                      {pct(s.b)}
                    </span>
                    <span className={`text-sm font-bold ${STATUS_TONE[s.status]}`}>{t(STATUS_KEY[s.status])}</span>
                    <Link href={`/runs/${run.id}`} className="text-sm font-semibold underline underline-offset-4 md:text-right">
                      {t("dash.view")}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      <section className="mt-12" aria-labelledby="quick-heading">
        <h2 id="quick-heading" className="text-xl font-extrabold tracking-tight">
          {t("dash.quick")}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              { href: "/lab?preset=blank", label: t("dash.qaNew"), primary: true },
              { href: "/lab", label: t("dash.qaLab"), primary: false },
              { href: "/runs", label: t("dash.qaHistory"), primary: false },
              { href: "/demo", label: t("dash.qaDemo"), primary: false },
            ] as const
          ).map((action) => (
            <li key={action.href}>
              <Link href={action.href} className={`btn w-full ${action.primary ? "btn-primary" : "btn-quiet"}`}>
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
