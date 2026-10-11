/** Pages that need a signed-in user. The server layouts and API routes check again, this is the first gate. */
export const PROTECTED_PREFIXES = ["/dashboard", "/lab", "/runs", "/account"] as const;

/** Pages only useful when signed out. Signed-in visitors go to the dashboard instead. */
export const SIGNED_OUT_ONLY_PREFIXES = ["/login", "/signup", "/forgot-password"] as const;

export type RouteDecision = { action: "allow" } | { action: "redirect"; to: string };

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function decideRoute(pathname: string, search: string, signedIn: boolean): RouteDecision {
  if (!signedIn && PROTECTED_PREFIXES.some((p) => matches(pathname, p))) {
    return { action: "redirect", to: `/login?next=${encodeURIComponent(`${pathname}${search}`)}` };
  }
  if (signedIn && SIGNED_OUT_ONLY_PREFIXES.some((p) => matches(pathname, p))) {
    return { action: "redirect", to: "/dashboard" };
  }
  return { action: "allow" };
}
