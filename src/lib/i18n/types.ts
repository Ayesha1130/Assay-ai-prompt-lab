import type { en } from "./en.ts";

/** Every key that exists in the English dictionary. */
export type TKey = keyof typeof en;

/** A complete dictionary. Adding a key to English makes every other language a compile error until it is translated. */
export type Dict = Record<TKey, string>;

export type Vars = Record<string, string | number>;
