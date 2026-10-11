import type { Metadata } from "next";

import { AuthPage } from "@/components/auth/AuthPage";
import { SignupForm } from "@/components/auth/SignupForm";
import { googleAuthEnabled } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <AuthPage titleKey="signup.title" bodyKey="signup.body">
      <SignupForm googleEnabled={googleAuthEnabled()} />
    </AuthPage>
  );
}
