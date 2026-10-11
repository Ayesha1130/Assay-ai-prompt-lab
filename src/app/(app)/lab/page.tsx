import type { Metadata } from "next";
import { Suspense } from "react";

import { LabClient } from "@/components/LabClient";

export const metadata: Metadata = { title: "Lab" };

export default function LabPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-5 py-12 text-mute sm:px-8">Loading the lab</div>}>
      <LabClient />
    </Suspense>
  );
}
