"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { useT } from "@/components/i18n/LanguageProvider";
import { authMessageKey } from "@/lib/auth/errors";
import { safeNext } from "@/lib/auth/redirect";
import { validateLogin } from "@/lib/auth/validation";
import { getBrowserClient } from "@/lib/supabase/client";

import { FormAlert, PasswordField, TextField } from "./fields";
import { GoogleButton } from "./GoogleButton";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const supabase = useMemo(() => getBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<ReturnType<typeof validateLogin>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const found = validateLogin({ email, password });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (!supabase) {
      setFormError(t("auth.notConfigured"));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setFormError(t(authMessageKey(error)));
      setLoading(false);
      return;
    }
    router.replace(next);
    router.refresh();
  };

  return (
    <>
      {!supabase ? <FormAlert tone="info">{t("auth.notConfigured")}</FormAlert> : null}
      {params.get("error") === "callback" ? <FormAlert>{t("login.callbackError")}</FormAlert> : null}

      <div className={!supabase || params.get("error") === "callback" ? "mt-5" : undefined}>
        {googleEnabled ? <GoogleButton next={next} onError={setFormError} /> : null}

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
          <PasswordField
            id="password"
            label={t("auth.password")}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            error={errors.password ? t(errors.password) : undefined}
            disabled={loading}
          />
          <div className="-mt-2 text-right">
            <Link href="/forgot-password" className="text-sm font-semibold text-mute underline underline-offset-4 hover:text-fg">
              {t("login.forgot")}
            </Link>
          </div>

          {formError ? <FormAlert>{formError}</FormAlert> : null}

          <button type="submit" disabled={loading || !supabase} className="btn btn-primary w-full">
            {loading ? t("login.submitting") : t("login.submit")}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-mute">
        {t("login.noAccount")}{" "}
        <Link href="/signup" className="font-semibold text-fg underline underline-offset-4">
          {t("login.signupLink")}
        </Link>
      </p>
    </>
  );
}
