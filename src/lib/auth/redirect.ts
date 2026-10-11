const BASE = "http://assay.invalid";

/** Pages that must never be a redirect target, so a bad link cannot trap someone in a loop. */
const BLOCKED_PREFIXES = ["/login", "/signup", "/forgot-password", "/auth/"];

/**
 * Turns a `next` value from a query string into a safe same-site path.
 * Anything that could leave this site (other hosts, protocol-relative URLs, backslash tricks,
 * control characters) falls back to a default page instead.
 */
export function safeNext(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw || raw.length > 512) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  // Backslashes are treated as slashes by some browsers, and control characters can hide a host.
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return fallback;

  let url: URL;
  try {
    url = new URL(raw, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE) return fallback;
  if (BLOCKED_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(p.endsWith("/") ? p : `${p}/`))) {
    return fallback;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
