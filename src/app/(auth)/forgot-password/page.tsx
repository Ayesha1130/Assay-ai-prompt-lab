import type { Metadata } from "next";

import { AuthPage } from "@/components/auth/AuthPage";
import { ForgotForm } from "@/components/auth/ForgotForm";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthPage titleKey="forgot.title" bodyKey="forgot.body">
      <ForgotForm />
    </AuthPage>
  );
}
