/** Validation for the auth forms. Messages are translation keys so every language gets the same checks. */

export type AuthErrorKey =
  | "err.nameRequired"
  | "err.nameLong"
  | "err.emailRequired"
  | "err.emailInvalid"
  | "err.passwordRequired"
  | "err.passwordShort"
  | "err.passwordLong"
  | "err.passwordMismatch";

export const MIN_PASSWORD = 8;
/** Supabase hashes with bcrypt, which ignores everything after 72 bytes. */
export const MAX_PASSWORD = 72;
export const MAX_NAME = 60;

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function emailError(email: string): AuthErrorKey | undefined {
  if (!email.trim()) return "err.emailRequired";
  if (!isValidEmail(email)) return "err.emailInvalid";
  return undefined;
}

function newPasswordError(password: string): AuthErrorKey | undefined {
  if (!password) return "err.passwordRequired";
  if (password.length < MIN_PASSWORD) return "err.passwordShort";
  if (new TextEncoder().encode(password).length > MAX_PASSWORD) return "err.passwordLong";
  return undefined;
}

type Errors<K extends string> = Partial<Record<K, AuthErrorKey>>;

function compact<K extends string>(errors: Errors<K>): Errors<K> {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v !== undefined)) as Errors<K>;
}

export function validateLogin(input: { email: string; password: string }): Errors<"email" | "password"> {
  return compact({
    email: emailError(input.email),
    password: input.password ? undefined : "err.passwordRequired",
  });
}

export function validateSignup(input: {
  name: string;
  email: string;
  password: string;
  confirm: string;
}): Errors<"name" | "email" | "password" | "confirm"> {
  const name = input.name.trim();
  return compact({
    name: !name ? "err.nameRequired" : name.length > MAX_NAME ? "err.nameLong" : undefined,
    email: emailError(input.email),
    password: newPasswordError(input.password),
    confirm: input.password && input.confirm !== input.password ? "err.passwordMismatch" : undefined,
  });
}

export function validateEmailOnly(input: { email: string }): Errors<"email"> {
  return compact({ email: emailError(input.email) });
}

export function validateNewPassword(input: { password: string; confirm: string }): Errors<"password" | "confirm"> {
  return compact({
    password: newPasswordError(input.password),
    confirm: input.password && input.confirm !== input.password ? "err.passwordMismatch" : undefined,
  });
}
