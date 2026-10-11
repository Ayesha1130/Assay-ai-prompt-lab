"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { useT } from "@/components/i18n/LanguageProvider";
import { authMessageKey } from "@/lib/auth/errors";
import { validateSignup } from "@/lib/auth/validation";
import { getBrowserClient } from "@/lib/supabase/client";

import { FormAlert, PasswordField, TextField } from "./fields";
import { GoogleButton } from "./GoogleButton";

export function SignupForm({ googleEnabled }: { googleEnabled: boolean }) {
  const t = useT();
  const router = useRouter();
  const supabase = useMemo(() => getBrowserClient(), []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<ReturnType<typeof validateSignup>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const found = validateSignup({ name, email, password, confirm });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (!supabase) {
      setFormError(t("auth.notConfigured"));
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        // Saved to the user's profile by a database trigger.
        data: { name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
      },
    });
    setLoading(false);

    if (error) {
      setFormError(t(authMessageKey(error)));
      return;
    }
    if (data.session) {
      // Email confirmation is switched off in Supabase, so the account is ready right away.
      router.replace("/dashboard");
      router.refresh();
      return;
    }
    // The same message is shown whether or not the email was already registered, so this form
    // cannot be used to find out who has an account.
    setSentTo(cleanEmail);
  };

  if (sentTo) {
    return (
      <>
        <FormAlert tone="success">
          <p className="font-bold">{t("signup.successTitle")}</p>
          <p className="mt-1">{t("signup.successBody", { email: sentTo })}</p>
        </FormAlert>
        <p className="mt-6 text-center text-sm text-mute">
          <Link href="/login" className="font-semibold text-fg underline underline-offset-4">
            {t("signup.loginLink")}
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      {!supabase ? (
        <div className="mb-5">
          <FormAlert tone="info">{t("auth.notConfigured")}</FormAlert>
        </div>
      ) : null}

      {googleEnabled ? <GoogleButton next="/dashboard" onError={setFormError} /> : null}

      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        <TextField id="name" label={t("auth.name")} value={name} onChange={setName} autoComplete="name" error={errors.name ? t(errors.name) : undefined} disabled={loading} />
        <TextField
          id="email"
          type="email"
          label={t("auth.email")}
          value={email}
          onChange={setEmail}
          autoComplete="email"
          error={errors.email ? t(errors.email) : undefined}
          disabled={loading}
        />
        <PasswordField
          id="password"
          label={t("auth.password")}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint={t("signup.passwordHint")}
          error={errors.password ? t(errors.password) : undefined}
          disabled={loading}
        />
        <PasswordField
          id="confirm"
          label={t("auth.confirm")}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          error={errors.confirm ? t(errors.confirm) : undefined}
          disabled={loading}
        />

        {formError ? <FormAlert>{formError}</FormAlert> : null}

        <button type="submit" disabled={loading || !supabase} className="btn btn-primary w-full">
          {loading ? t("signup.submitting") : t("signup.submit")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-mute">
        {t("signup.haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-fg underline underline-offset-4">
          {t("signup.loginLink")}
        </Link>
      </p>
    </>
  );
}
