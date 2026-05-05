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
      router.push("/admin");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Đăng nhập không thành công.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthField
        label="Email quản trị"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="admin@example.com"
      />
      <AuthField
        label="Mật khẩu"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Nhập mật khẩu"
        minLength={8}
      />
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      <SubmitButton>{isSubmitting ? "Đang đăng nhập..." : "Đăng nhập quản trị"}</SubmitButton>
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
      setError(caughtError instanceof Error ? caughtError.message : "Tạo tài khoản không thành công.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthField
        label="Họ và tên"
        name="full_name"
        type="text"
        autoComplete="name"
        placeholder="Người dùng"
      />
      <AuthField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="customer@example.com"
      />
      <AuthField
        label="Số điện thoại"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="+84"
        required={false}
      />
      <AuthField
        label="Mật khẩu"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Tối thiểu 8 ký tự"
        minLength={8}
      />
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      <SubmitButton>{isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}</SubmitButton>
    </form>
  );
}
