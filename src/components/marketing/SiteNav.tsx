"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useT } from "@/components/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Logo } from "@/components/Logo";

export function SiteNav({ signedIn }: { signedIn: boolean }) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    { href: "/#features", label: t("nav.features") },
    { href: "/#how-it-works", label: t("nav.how") },
    { href: "/demo", label: t("nav.demo") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur-md">
      <nav aria-label={t("nav.main")} className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Logo />

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="rounded-full px-4 py-2 text-sm font-semibold text-mute transition-colors hover:text-fg">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {signedIn ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              {t("nav.dashboard")}
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-2 text-sm font-semibold text-mute transition-colors hover:text-fg">
                {t("nav.signIn")}
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm">
                {t("nav.getStarted")}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg border border-line md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t("nav.closeMenu") : t("nav.menu")}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
          </svg>
        </button>
      </nav>

      {open ? (
        <div id="mobile-menu" className="border-t border-line/60 bg-bg px-5 pb-6 pt-3 md:hidden">
          <ul className="grid gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block rounded-lg px-3 py-3 text-base font-semibold hover:bg-panel">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            {signedIn ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">
                {t("nav.dashboard")}
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-quiet btn-sm">
                  {t("nav.signIn")}
                </Link>
                <Link href="/signup" className="btn btn-primary btn-sm">
                  {t("nav.getStarted")}
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
