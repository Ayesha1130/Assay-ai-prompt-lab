"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";

import { useT } from "@/components/i18n/LanguageProvider";
import { authMessageKey } from "@/lib/auth/errors";
import { validateEmailOnly } from "@/lib/auth/validation";
import { getBrowserClient } from "@/lib/supabase/client";

import { FormAlert, TextField } from "./fields";

export function ForgotForm() {
  const t = useT();
  const supabase = useMemo(() => getBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<ReturnType<typeof validateEmailOnly>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const found = validateEmailOnly({ email });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (!supabase) {
      setFormError(t("auth.notConfigured"));
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
    });
    setLoading(false);

    // Only a rate limit is reported. Any other outcome shows the same message, so this form cannot
    // be used to check whether an email address has an account.
    if (error && authMessageKey(error) === "authErr.rateLimited") {
      setFormError(t("authErr.rateLimited"));
      return;
    }
    setSentTo(cleanEmail);
  };

  return (
    <>
      {sentTo ? (
        <FormAlert tone="success">
          <p className="font-bold">{t("forgot.successTitle")}</p>
          <p className="mt-1">{t("forgot.successBody", { email: sentTo })}</p>
        </FormAlert>
      ) : (
        <>
          {!supabase ? (
            <div className="mb-5">
              <FormAlert tone="info">{t("auth.notConfigured")}</FormAlert>
            </div>
          ) : null}
          <form onSubmit={onSubmit} noValidate className="grid gap-5">
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
            {formError ? <FormAlert>{formError}</FormAlert> : null}
            <button type="submit" disabled={loading || !supabase} className="btn btn-primary w-full">
              {loading ? t("forgot.sending") : t("forgot.submit")}
            </button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-fg underline underline-offset-4">
          {t("forgot.back")}
        </Link>
      </p>
    </>
  );
}
