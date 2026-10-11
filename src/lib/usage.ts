/**
 * Limits on paid model runs. Being signed in does not give unlimited access to a paid API key:
 * each account gets a small hourly and daily allowance, tracked in the database where the user
 * cannot edit or delete it (see supabase/migrations/0002_ownership_profiles_usage.sql).
 */

export interface UsageLimits {
  perHour: number;
  perDay: number;
}

export type UsageVerdict = { ok: true } | { ok: false; reason: "hour" | "day" };

export const DEFAULT_LIMITS: UsageLimits = { perHour: 6, perDay: 30 };

/** Paid runs can hold fewer test cases than demo runs, so one click cannot spend a whole day's allowance. */
export const PAID_MAX_CASES = 12;

function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 1000) : fallback;
}

export function readLimits(env: Record<string, string | undefined>): UsageLimits {
  return {
    perHour: positiveInt(env.PAID_RUNS_PER_HOUR, DEFAULT_LIMITS.perHour),
    perDay: positiveInt(env.PAID_RUNS_PER_DAY, DEFAULT_LIMITS.perDay),
  };
}

/** Counts are the runs already recorded, so the new run is allowed while the count is below the limit. */
export function evaluateUsage(hourCount: number, dayCount: number, limits: UsageLimits): UsageVerdict {
  if (hourCount >= limits.perHour) return { ok: false, reason: "hour" };
  if (dayCount >= limits.perDay) return { ok: false, reason: "day" };
  return { ok: true };
}

export function limitMessage(reason: "hour" | "day", limits: UsageLimits): string {
  return reason === "hour"
    ? `You have used your ${limits.perHour} paid runs for this hour. Try again later, or use the demo model, which is free.`
    : `You have used your ${limits.perDay} paid runs for today. They reset after 24 hours, and the demo model is always free.`;
}
