import type { ReactNode } from "react";

import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { SkipLink } from "@/components/SkipLink";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <SkipLink />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="hero-grid absolute inset-0" />
        <div className="hero-glow-a -left-32 top-10 h-72 w-72" />
        <div className="hero-glow-b -right-24 top-40 h-72 w-72" />
      </div>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <LanguageSwitcher />
      </header>
      <main id="main" className="mx-auto w-full max-w-md px-5 pb-16 pt-6 sm:pt-12">
        {children}
      </main>
    </div>
  );
}
