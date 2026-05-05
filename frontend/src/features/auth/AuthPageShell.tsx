import Link from "next/link";
import type { ReactNode } from "react";

type AuthPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footerLabel: string;
  footerHref: string;
  footerCta: string;
};

export function AuthPageShell({
  eyebrow,
  title,
  description,
  children,
  footerLabel,
  footerHref,
  footerCta,
}: AuthPageShellProps) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-13rem)] max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[0.9fr_1fr] lg:items-center">
      <section className="space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">{eyebrow}</p>
        <h1 className="max-w-3xl text-4xl leading-tight text-emerald-950 md:text-6xl">{title}</h1>
        <p className="max-w-xl text-base leading-8 text-emerald-900/75 md:text-lg">{description}</p>
        <div className="grid max-w-xl gap-4 sm:grid-cols-3">
          {["Cookie an toàn", "Xác thực backend", "Sẵn sàng RBAC"].map((item) => (
            <div key={item} className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
              <p className="text-sm font-medium text-emerald-900">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-100 bg-white/92 p-7 shadow-[0_28px_70px_rgba(6,78,59,0.10)]">
        {children}
        <p className="mt-8 border-t border-emerald-100 pt-6 text-sm text-emerald-900/75">
          {footerLabel}{" "}
          <Link href={footerHref} className="font-semibold text-emerald-950 hover:text-emerald-800">
            {footerCta}
          </Link>
        </p>
      </section>
    </div>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  required?: boolean;
  minLength?: number;
};

export function AuthField({
  label,
  name,
  type,
  autoComplete,
  placeholder,
  required = true,
  minLength,
}: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-emerald-800">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-base text-emerald-950 outline-none transition placeholder:text-emerald-600 focus:border-emerald-700 focus:bg-white"
      />
    </label>
  );
}

type SubmitButtonProps = {
  children: ReactNode;
};

export function SubmitButton({ children }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className="w-full rounded-full bg-emerald-950 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-emerald-900"
    >
      {children}
    </button>
  );
}
