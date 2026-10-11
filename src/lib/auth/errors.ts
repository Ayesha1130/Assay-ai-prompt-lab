/** Turns a Supabase Auth error into a friendly translation key without leaking details. */

export interface AuthErrorLike {
  code?: string;
  message?: string;
  status?: number;
}

export type AuthMessageKey =
  | "authErr.invalidCredentials"
  | "authErr.emailNotConfirmed"
  | "authErr.rateLimited"
  | "authErr.weakPassword"
  | "authErr.sameAsOld"
  | "authErr.sessionExpired"
  | "authErr.signupDisabled"
  | "authErr.network"
  | "authErr.generic";

export function authMessageKey(error: AuthErrorLike | null | undefined): AuthMessageKey {
  const code = error?.code ?? "";
  const text = (error?.message ?? "").toLowerCase();

  if (code === "invalid_credentials" || text.includes("invalid login credentials")) return "authErr.invalidCredentials";
  if (code === "email_not_confirmed" || text.includes("email not confirmed")) return "authErr.emailNotConfirmed";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || error?.status === 429) {
    return "authErr.rateLimited";
  }
  if (code === "weak_password" || text.includes("password should be")) return "authErr.weakPassword";
  if (code === "same_password") return "authErr.sameAsOld";
  if (code === "session_not_found" || code === "session_expired" || text.includes("auth session missing")) {
    return "authErr.sessionExpired";
  }
  if (code === "signup_disabled" || code === "email_provider_disabled") return "authErr.signupDisabled";
  if (text.includes("failed to fetch") || text.includes("network")) return "authErr.network";
  return "authErr.generic";
}
