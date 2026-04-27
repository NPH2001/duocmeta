"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  clearAccessToken,
  fetchCurrentUser,
  readStoredAccessToken,
  refreshSession,
  storeAccessToken,
  type AuthUser,
} from "lib/auth";

type AccountState =
  | { status: "loading"; user: null; error: null }
  | { status: "guest"; user: null; error: string | null }
  | { status: "authenticated"; user: AuthUser; error: null };

export function AccountOverviewPage() {
  const [accountState, setAccountState] = useState<AccountState>({
    status: "loading",
    user: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadAccount() {
      const storedToken = readStoredAccessToken();

      if (storedToken) {
        try {
          const user = await fetchCurrentUser(storedToken);
          if (isMounted) {
            setAccountState({ status: "authenticated", user, error: null });
          }
          return;
        } catch {
          clearAccessToken();
        }
      }

      try {
        const refreshed = await refreshSession();
        storeAccessToken(refreshed.access_token);
        if (isMounted) {
          setAccountState({ status: "authenticated", user: refreshed.user, error: null });
        }
      } catch {
        if (isMounted) {
          setAccountState({
            status: "guest",
            user: null,
            error: "Login is required to view account details.",
          });
        }
      }
    }

    void loadAccount();

    return () => {
      isMounted = false;
    };
  }, []);

  if (accountState.status === "loading") {
    return (
      <AccountShell title="Account" eyebrow="Customer">
        <div className="rounded-2xl border border-stone-200 bg-white/80 p-8 text-sm text-stone-600">
          Loading account...
        </div>
      </AccountShell>
    );
  }

  if (accountState.status === "guest") {
    return (
      <AccountShell title="Login required" eyebrow="Customer">
        <section className="rounded-2xl border border-stone-200 bg-white/88 p-8 text-center">
          <h2 className="text-2xl text-stone-950">Access your account</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">
            {accountState.error}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <PrimaryLink href="/login">Login</PrimaryLink>
            <SecondaryLink href="/register">Create Account</SecondaryLink>
          </div>
        </section>
      </AccountShell>
    );
  }

  const user = accountState.user;

  return (
    <AccountShell title="Account overview" eyebrow="Customer">
      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-stone-200 bg-white/88 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Profile
          </p>
          <h2 className="mt-4 text-3xl text-stone-950">{user.full_name}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ProfileField label="Email" value={user.email} />
            <ProfileField label="Phone" value={user.phone ?? "Not provided"} />
            <ProfileField label="Status" value={user.status} />
            <ProfileField
              label="Email verification"
              value={user.email_verified_at ? "Verified" : "Pending"}
            />
          </div>
        </div>

        <aside className="rounded-2xl border border-stone-200 bg-stone-950 p-6 text-stone-100">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Orders
          </p>
          <h2 className="mt-4 text-2xl leading-tight">View purchase history</h2>
          <p className="mt-3 text-sm leading-7 text-stone-300">
            Order data stays owned by backend APIs. The next screens will list and open your own orders.
          </p>
          <Link
            href="/account/orders"
            className="mt-6 inline-flex w-full justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-950 hover:bg-stone-100"
          >
            Order History
          </Link>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ActionCard
          title="Orders"
          description="Track recent purchases and fulfillment status."
          href="/account/orders"
        />
        <ActionCard title="Cart" description="Review items before checkout." href="/cart" />
        <ActionCard title="Support" description="Use your account email when contacting support." href="/contact" />
      </section>
    </AccountShell>
  );
}

function AccountShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10 md:py-14">
      <section className="border-b border-stone-200 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">{eyebrow}</p>
        <h1 className="mt-3 text-4xl leading-tight text-stone-950 md:text-5xl">{title}</h1>
      </section>
      {children}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-stone-950">{value}</p>
    </div>
  );
}

function ActionCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-stone-200 bg-white/88 p-5 hover:border-stone-400">
      <p className="text-lg text-stone-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
    </Link>
  );
}

function PrimaryLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex justify-center rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white hover:bg-stone-800"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex justify-center rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-700 hover:border-stone-950 hover:text-stone-950"
    >
      {children}
    </Link>
  );
}
