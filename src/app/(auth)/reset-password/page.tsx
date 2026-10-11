import type { Metadata } from "next";

import { AuthPage } from "@/components/auth/AuthPage";
import { ResetForm } from "@/components/auth/ResetForm";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <AuthPage titleKey="reset.title" bodyKey="reset.body">
      <ResetForm />
    </AuthPage>
  );
}
