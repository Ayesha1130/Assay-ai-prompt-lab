"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useT } from "@/components/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Logo } from "@/components/Logo";

function SignOut({ className }: { className?: string }) {
  const t = useT();
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className={className}>
        {t("app.signOut")}
      </button>
    </form>
  );
}

export function AppNav({ displayName }: { displayName: string }) {
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
    { href: "/dashboard", label: t("app.dashboard") },
    { href: "/lab", label: t("app.lab") },
    { href: "/runs", label: t("app.history") },
    { href: "/account", label: t("app.account") },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/85 backdrop-blur-md">
      <nav aria-label={t("nav.main")} className="mx-auto flex h-16 max-w-[88rem] items-center justify-between gap-6 px-5 sm:px-8">
        <Logo href="/dashboard" />

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive(link.href) ? "bg-raised text-fg" : "text-mute hover:text-fg"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <span className="max-w-40 truncate text-sm text-mute" title={displayName}>
            {displayName}
          </span>
          <LanguageSwitcher />
          <SignOut className="btn btn-quiet btn-sm" />
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg border border-line md:hidden"
          aria-expanded={open}
          aria-controls="app-mobile-menu"
          aria-label={open ? t("nav.closeMenu") : t("nav.menu")}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
          </svg>
        </button>
      </nav>

      {open ? (
        <div id="app-mobile-menu" className="border-t border-line/60 bg-bg px-5 pb-6 pt-3 md:hidden">
          <p className="px-3 pb-2 text-sm text-mute">{displayName}</p>
          <ul className="grid gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`block rounded-lg px-3 py-3 text-base font-semibold ${isActive(link.href) ? "bg-raised" : "hover:bg-panel"}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <SignOut className="btn btn-quiet btn-sm" />
          </div>
        </div>
      ) : null}
    </header>
  );
}
