"use client";

import Link from "next/link";

import { useT } from "@/components/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  const t = useT();

  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-[38ch] leading-relaxed text-mute">{t("footer.tagline")}</p>
        </div>
        <div className="flex flex-col items-start gap-5 md:items-end">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-mute">
            <li>
              <Link href="/#features" className="hover:text-fg">
                {t("nav.features")}
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works" className="hover:text-fg">
                {t("nav.how")}
              </Link>
            </li>
            <li>
              <Link href="/demo" className="hover:text-fg">
                {t("nav.demo")}
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-fg">
                {t("nav.signIn")}
              </Link>
            </li>
          </ul>
          <LanguageSwitcher />
        </div>
      </div>
      <div className="border-t border-line/70">
        <p className="mx-auto max-w-6xl px-5 py-5 text-sm text-mute sm:px-8">{t("footer.built")}</p>
      </div>
    </footer>
  );
}
