"use client";

import { useState, type ReactNode } from "react";

import { useT } from "@/components/i18n/LanguageProvider";

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  autoComplete?: string;
  disabled?: boolean;
}

function describedBy(id: string, error?: string, hint?: string) {
  const ids = [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

function Messages({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  return (
    <>
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-mute">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-fail">
          {error}
        </p>
      ) : null}
    </>
  );
}

export function TextField({ type = "text", ...props }: FieldProps & { type?: "text" | "email" }) {
  const { id, label, value, onChange, error, hint, autoComplete, disabled } = props;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`field ${error ? "border-fail" : ""}`}
      />
      <Messages id={id} error={error} hint={hint} />
    </div>
  );
}

/** A password box with a show/hide button. */
export function PasswordField(props: FieldProps) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const { id, label, value, onChange, error, hint, autoComplete, disabled } = props;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={`field pr-11 ${error ? "border-fail" : ""}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("auth.hide") : t("auth.show")}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-mute hover:text-fg"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {visible ? (
              <>
                <path d="M3 3l18 18" />
                <path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 4.5 10 6-.5.8-1.7 2.3-3.4 3.6M6.5 7.6C4.4 9 2.9 11 2 12c1 1.5 5 6 10 6 1.4 0 2.7-.3 3.8-.8" />
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
              </>
            ) : (
              <>
                <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
      <Messages id={id} error={error} hint={hint} />
    </div>
  );
}

export function FormAlert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" | "info" }) {
  const styles = {
    error: "border-fail/60 bg-fail/10",
    success: "border-pass/50 bg-pass/10",
    info: "border-line bg-panel",
  }[tone];

  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${styles}`}>
      {children}
    </div>
  );
}
