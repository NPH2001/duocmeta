"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthField, SubmitButton } from "features/auth/AuthPageShell";
import { loginWithPassword, registerCustomer, storeAccessToken } from "lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await loginWithPassword(String(formData.get("email")), String(formData.get("password")));
      storeAccessToken(result.access_token);
      router.push("/");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="customer@example.com"
      />
      <AuthField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Enter your password"
        minLength={8}
      />
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      <SubmitButton>{isSubmitting ? "Logging in..." : "Login"}</SubmitButton>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const phone = String(formData.get("phone") ?? "").trim();

    try {
      const result = await registerCustomer({
        full_name: String(formData.get("full_name")),
        email: String(formData.get("email")),
        password: String(formData.get("password")),
        ...(phone ? { phone } : {}),
      });
      storeAccessToken(result.access_token);
      router.push("/");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthField
        label="Full name"
        name="full_name"
        type="text"
        autoComplete="name"
        placeholder="Customer User"
      />
      <AuthField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="customer@example.com"
      />
      <AuthField
        label="Phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="+84"
        required={false}
      />
      <AuthField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        minLength={8}
      />
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      <SubmitButton>{isSubmitting ? "Creating..." : "Create Account"}</SubmitButton>
    </form>
  );
}
