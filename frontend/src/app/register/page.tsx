import type { Metadata } from "next";

import { AuthPageShell } from "features/auth/AuthPageShell";
import { RegisterForm } from "features/auth/AuthForms";
import { buildPublicMetadata, noIndexRobots } from "lib/seo";

export function generateMetadata(): Metadata {
  return {
    ...buildPublicMetadata({
      title: "Register",
      description: "Create a Duocmeta customer account.",
      path: "/register",
    }),
    robots: noIndexRobots,
  };
}

export default function RegisterPage() {
  return (
    <AuthPageShell
      eyebrow="Customer Registration"
      title="Create your customer account."
      description="Registration fields align with the backend auth API and keep customer identity rules server-owned."
      footerLabel="Already have an account?"
      footerHref="/login"
      footerCta="Log in"
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
