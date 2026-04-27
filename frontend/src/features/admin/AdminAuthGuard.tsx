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
import { AdminApiError, verifyAdminAccess } from "lib/admin";

type AdminGuardState =
  | { status: "loading"; user: null; error: null }
  | { status: "guest"; user: null; error: string }
  | { status: "forbidden"; user: AuthUser | null; error: string }
  | { status: "ready"; user: AuthUser; error: null };

export function AdminAuthGuard({ children }: { children: ReactNode }) {
  const [guardState, setGuardState] = useState<AdminGuardState>({
    status: "loading",
    user: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadAdminSession() {
      const storedToken = readStoredAccessToken();

      if (storedToken) {
        try {
          const user = await fetchCurrentUser(storedToken);
          await verifyAdminAccess(storedToken);
          if (isMounted) {
            setGuardState({ status: "ready", user, error: null });
          }
          return;
        } catch (caughtError) {
          if (isForbidden(caughtError)) {
            if (isMounted) {
              setGuardState({
                status: "forbidden",
                user: null,
                error: "Your account does not have access to the admin system.",
              });
            }
            return;
          }

          clearAccessToken();
        }
      }

      try {
        const refreshed = await refreshSession();
        storeAccessToken(refreshed.access_token);
        await verifyAdminAccess(refreshed.access_token);
        if (isMounted) {
          setGuardState({ status: "ready", user: refreshed.user, error: null });
        }
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        if (isForbidden(caughtError)) {
          setGuardState({
            status: "forbidden",
            user: null,
            error: "Your account does not have access to the admin system.",
          });
          return;
        }

        setGuardState({
          status: "guest",
          user: null,
          error: "Login is required to access the admin system.",
        });
      }
    }

    void loadAdminSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (guardState.status === "loading") {
    return <AdminStatePanel title="Checking access" message="Loading admin session..." />;
  }

  if (guardState.status === "guest") {
    return (
      <AdminStatePanel
        action={<AdminLink href="/login">Login</AdminLink>}
        message={guardState.error}
        title="Login required"
      />
    );
  }

  if (guardState.status === "forbidden") {
    return (
      <AdminStatePanel
        action={<AdminLink href="/">Back to Storefront</AdminLink>}
        message={guardState.error}
        tone="error"
        title="Access denied"
      />
    );
  }

  return <>{children}</>;
}

function isForbidden(error: unknown): boolean {
  return error instanceof AdminApiError && error.statusCode === 403;
}

function AdminStatePanel({
  action,
  message,
  title,
  tone = "neutral",
}: {
  action?: ReactNode;
  message: string;
  title: string;
  tone?: "neutral" | "error";
}) {
  const className =
    tone === "error"
      ? "mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
      : "mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 text-center";

  return (
    <section className={className}>
      <h1 className="text-3xl text-stone-950">{title}</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">{message}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}

function AdminLink({ children, href }: { children: string; href: string }) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex justify-center rounded-full bg-stone-950 px-6 py-3",
        "text-sm font-semibold uppercase tracking-[0.16em] text-white hover:bg-stone-800",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
