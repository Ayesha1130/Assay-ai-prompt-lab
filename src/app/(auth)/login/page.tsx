import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthPage } from "@/components/auth/AuthPage";
import { LoginForm } from "@/components/auth/LoginForm";
import { googleAuthEnabled } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthPage titleKey="login.title" bodyKey="login.body">
      <Suspense fallback={null}>
        <LoginForm googleEnabled={googleAuthEnabled()} />
      </Suspense>
    </AuthPage>
  );
}
