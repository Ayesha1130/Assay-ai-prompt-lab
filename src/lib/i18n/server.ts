import { cookies } from "next/headers";

import { DEFAULT_LANG, LANG_COOKIE, isLang, translate, type Lang, type TKey, type Vars } from "./translate.ts";

/** The language chosen on this device, read from a cookie so the server renders the right text with no flash. */
export async function getServerLang(): Promise<{ lang: Lang; fromCookie: boolean }> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? { lang: value, fromCookie: true } : { lang: DEFAULT_LANG, fromCookie: false };
}

/** A translate function for Server Components. */
export async function getServerT(): Promise<(key: TKey, vars?: Vars) => string> {
  const { lang } = await getServerLang();
  return (key, vars) => translate(lang, key, vars);
}
