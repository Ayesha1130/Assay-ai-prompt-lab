import type { Side } from "./engine/types";

/** Full class names are written out so Tailwind can see them. A is always marigold, B always orchid. */
export const SIDE_STYLE: Record<
  Side,
  { text: string; bg: string; border: string; topRule: string; leftRule: string; hex: string }
> = {
  A: {
    text: "text-side-a",
    bg: "bg-side-a",
    border: "border-side-a",
    topRule: "border-t-side-a",
    leftRule: "border-l-side-a",
    hex: "#ffb020",
  },
  B: {
    text: "text-side-b",
    bg: "bg-side-b",
    border: "border-side-b",
    topRule: "border-t-side-b",
    leftRule: "border-l-side-b",
    hex: "#c58bff",
  },
};

export const PASS_HEX = "#6ff0b0";
export const FAIL_HEX = "#ff7385";
