import type { Metadata } from "next";

import { RunsList } from "@/components/RunsList";

export const metadata: Metadata = { title: "History" };

export default function RunsPage() {
  return <RunsList />;
}
