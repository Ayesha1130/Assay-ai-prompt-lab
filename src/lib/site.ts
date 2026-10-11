/**
 * The public address of this site, used to build links that Supabase emails and redirects to.
 * Set NEXT_PUBLIC_SITE_URL in production. Otherwise the address of the current request is used.
 */
export function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // fall through to the request address
    }
  }
  return new URL(request.url).origin;
}

/** True when a state-changing request came from this site, a basic defence against cross-site form posts. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin navigations and non-browser clients send no Origin on some requests
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
