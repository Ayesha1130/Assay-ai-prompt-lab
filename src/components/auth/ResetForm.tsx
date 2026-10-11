"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { useT } from "@/components/i18n/LanguageProvider";
import { authMessageKey } from "@/lib/auth/errors";
import { validateNewPassword } from "@/lib/auth/validation";
import { getBrowserClient } from "@/lib/supabase/client";

import { FormAlert, PasswordField } from "./fields";

type Stage = "checking" | "ready" | "invalid" | "done";

/** Reached from the reset email. The link has already been exchanged for a session by /auth/callback. */
export function ResetForm() {
  const t = useT();
  const supabase = useMemo(() => getBrowserClient(), []);

  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<ReturnType<typeof validateNewPassword>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let live = true;
    if (!supabase) {
      setStage("invalid");
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (live) setStage(data.user ? "ready" : "invalid");
    });
    return () => {
      live = false;
    };
  }, [supabase]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const found = validateNewPassword({ password, confirm });
    setErrors(found);
    if (Object.keys(found).length > 0 || !supabase) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setFormError(t(authMessageKey(error)));
      return;
    }
    setStage("done");
  };

  if (stage === "checking") return <p className="text-mute">{t("reset.checking")}</p>;

  if (stage === "invalid") {
    return (
      <>
        <FormAlert>
          <p className="font-bold">{t("reset.invalidTitle")}</p>
          <p className="mt-1">{t("reset.invalidBody")}</p>
        </FormAlert>
        <Link href="/forgot-password" className="btn btn-primary mt-6 w-full">
          {t("reset.requestNew")}
        </Link>
      </>
    );
  }

  if (stage === "done") {
    return (
      <>
        <FormAlert tone="success">
          <p className="font-bold">{t("reset.successTitle")}</p>
          <p className="mt-1">{t("reset.successBody")}</p>
        </FormAlert>
        <Link href="/dashboard" className="btn btn-primary mt-6 w-full">
          {t("nav.dashboard")}
        </Link>
      </>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <PasswordField
        id="password"
        label={t("reset.password")}
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
      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? t("reset.updating") : t("reset.submit")}
      </button>
    </form>
  );
}
