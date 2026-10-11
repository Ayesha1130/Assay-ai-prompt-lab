import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Spline_Sans_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { getServerLang } from "@/lib/i18n/server";
import { htmlLangFor } from "@/lib/i18n/translate";

import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const mono = Spline_Sans_Mono({ subsets: ["latin"], variable: "--font-spline", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Assay: test and compare your AI prompts",
    template: "%s | Assay",
  },
  description:
    "Compare AI prompts side by side, score every answer against real test cases, and see which prompt is more accurate, faster and cheaper.",
};

export const viewport: Viewport = {
  themeColor: "#0a0c18",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { lang, fromCookie } = await getServerLang();

  return (
    <html lang={htmlLangFor(lang)} className={`${display.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">
        <LanguageProvider initial={lang} fromCookie={fromCookie}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
