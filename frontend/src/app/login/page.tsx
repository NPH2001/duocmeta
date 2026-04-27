import type { Metadata } from "next";
import Link from "next/link";

import { AuthPageShell } from "features/auth/AuthPageShell";
import { LoginForm } from "features/auth/AuthForms";
import { buildPublicMetadata } from "lib/seo";

export function generateMetadata(): Metadata {
  return buildPublicMetadata({
    title: "Login",
    description: "Log in to your Duocmeta customer account.",
    path: "/login",
  });
}

export default function LoginPage() {
  return (
    <AuthPageShell
      eyebrow="Customer Login"
      title="Access your Duocmeta account."
      description="The page is ready for the backend auth endpoints while persistent frontend auth state remains scoped to the next ticket."
      footerLabel="New to Duocmeta?"
      footerHref="/register"
      footerCta="Create an account"
    >
      <LoginForm />
      <p className="mt-5 text-right text-sm">
        <Link href="/forgot-password" className="font-medium text-stone-950 hover:text-emerald-800">
          Forgot password?
        </Link>
      </p>
    </AuthPageShell>
  );
}
