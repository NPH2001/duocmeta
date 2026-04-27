import type { Metadata } from "next";

import { AuthField, AuthPageShell, SubmitButton } from "features/auth/AuthPageShell";
import { buildPublicMetadata } from "lib/seo";

export function generateMetadata(): Metadata {
  return buildPublicMetadata({
    title: "Forgot Password",
    description: "Request password recovery for a Duocmeta customer account.",
    path: "/forgot-password",
  });
}

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      eyebrow="Account Recovery"
      title="Reset access to your account."
      description="This shell reserves the password recovery surface for the later backend reset-token flow."
      footerLabel="Remembered your password?"
      footerHref="/login"
      footerCta="Return to login"
    >
      <form method="post" action="/api/v1/auth/forgot-password" className="space-y-5">
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="customer@example.com"
        />
        <SubmitButton>Request Reset</SubmitButton>
      </form>
    </AuthPageShell>
  );
}
