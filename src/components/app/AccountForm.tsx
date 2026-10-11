"use client";

import { useMemo, useState, type FormEvent } from "react";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { FormAlert, PasswordField, TextField } from "@/components/auth/fields";
import { authMessageKey } from "@/lib/auth/errors";
import { validateNewPassword } from "@/lib/auth/validation";
import { LANGUAGES, isLang, type Lang } from "@/lib/i18n/translate";
import { getBrowserClient } from "@/lib/supabase/client";

interface Props {
  email: string;
  initialName: string;
  initialLanguage: Lang | null;
  since: string;
  canChangePassword: boolean;
}

export function AccountForm({ email, initialName, initialLanguage, since, canChangePassword }: Props) {
  const { t, lang, setLang } = useLanguage();
  const supabase = useMemo(() => getBrowserClient(), []);

  const [name, setName] = useState(initialName);
  const [language, setLanguage] = useState<Lang>(initialLanguage ?? lang);
  const [nameError, setNameError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwErrors, setPwErrors] = useState<ReturnType<typeof validateNewPassword>>({});
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileMsg(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t("err.nameRequired"));
      return;
    }
    setNameError(undefined);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ display_name: trimmed, preferred_language: language }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setLang(language);
      setProfileMsg({ tone: "success", text: t("acct.saved") });
    } catch {
      setProfileMsg({ tone: "error", text: t("acct.saveError") });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPwMsg(null);
    const found = validateNewPassword({ password, confirm });
    setPwErrors(found);
    if (Object.keys(found).length > 0 || !supabase) return;

    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPwBusy(false);
    if (error) {
      setPwMsg({ tone: "error", text: t(authMessageKey(error)) });
      return;
    }
    setPassword("");
    setConfirm("");
    setPwMsg({ tone: "success", text: t("acct.passwordUpdated") });
  };

  return (
    <div className="mt-8 grid gap-8">
      <form onSubmit={saveProfile} noValidate className="grid gap-5 rounded-2xl border border-line bg-panel p-6">
        <TextField
          id="name"
          label={t("acct.name")}
          value={name}
          onChange={setName}
          autoComplete="name"
          error={nameError}
          disabled={saving}
        />

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
            {t("acct.email")}
          </label>
          <input id="email" type="email" value={email} readOnly aria-describedby="email-note" className="field opacity-70" />
          <p id="email-note" className="mt-1.5 text-xs text-mute">
            {t("acct.emailNote")}
          </p>
        </div>

        <div>
          <label htmlFor="language" className="mb-1.5 block text-sm font-semibold">
            {t("acct.language")}
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => isLang(e.target.value) && setLanguage(e.target.value)}
            disabled={saving}
            className="field"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-mute">
          {t("acct.since")}: <span className="font-semibold text-fg">{since}</span>
        </p>

        {profileMsg ? <FormAlert tone={profileMsg.tone}>{profileMsg.text}</FormAlert> : null}
        <button type="submit" disabled={saving} className="btn btn-primary justify-self-start">
          {saving ? t("acct.saving") : t("acct.save")}
        </button>
      </form>

      {canChangePassword ? (
        <form onSubmit={changePassword} noValidate className="grid gap-5 rounded-2xl border border-line bg-panel p-6">
          <h2 className="text-lg font-bold">{t("acct.password")}</h2>
          <PasswordField
            id="new-password"
            label={t("acct.newPassword")}
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            hint={t("signup.passwordHint")}
            error={pwErrors.password ? t(pwErrors.password) : undefined}
            disabled={pwBusy}
          />
          <PasswordField
            id="confirm-password"
            label={t("auth.confirm")}
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            error={pwErrors.confirm ? t(pwErrors.confirm) : undefined}
            disabled={pwBusy}
          />
          {pwMsg ? <FormAlert tone={pwMsg.tone}>{pwMsg.text}</FormAlert> : null}
          <button type="submit" disabled={pwBusy} className="btn btn-quiet justify-self-start">
            {t("acct.updatePassword")}
          </button>
        </form>
      ) : null}

      <form action="/auth/signout" method="post">
        <button type="submit" className="btn btn-quiet">
          {t("acct.signOut")}
        </button>
      </form>
    </div>
  );
}
