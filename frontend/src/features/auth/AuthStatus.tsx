"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useLanguage } from "features/i18n/LanguageProvider";
import { onBrowserIdle } from "lib/browser-idle";
import {
  clearAccessToken,
  fetchCurrentUser,
  readStoredAccessToken,
  refreshSession,
  storeAccessToken,
  type AuthUser,
} from "lib/auth";

type AuthState =
  | { status: "loading"; user: null }
  | { status: "guest"; user: null }
  | { status: "authenticated"; user: AuthUser };

export function AuthStatus() {
  const { t } = useLanguage();
  const [authState, setAuthState] = useState<AuthState>({ status: "loading", user: null });

  useEffect(() => {
    let isMounted = true;
    let cancelIdleAuthCheck: (() => void) | null = null;

    async function loadAuthState() {
      const storedToken = readStoredAccessToken();

      if (storedToken) {
        try {
          const user = await fetchCurrentUser(storedToken);

          if (isMounted) {
            setAuthState({ status: "authenticated", user });
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
          setAuthState({ status: "authenticated", user: refreshed.user });
        }
      } catch {
        if (isMounted) {
          setAuthState({ status: "guest", user: null });
        }
      }
    }

    if (readStoredAccessToken()) {
      void loadAuthState();
    } else {
      cancelIdleAuthCheck = onBrowserIdle(() => {
        void loadAuthState();
      });
    }

    function handleAuthChange() {
      cancelIdleAuthCheck?.();
      cancelIdleAuthCheck = null;
      void loadAuthState();
    }

    window.addEventListener("duocmeta-auth-change", handleAuthChange);

    return () => {
      isMounted = false;
      cancelIdleAuthCheck?.();
      window.removeEventListener("duocmeta-auth-change", handleAuthChange);
    };
  }, []);

  if (authState.status === "loading") {
    return (
      <span className="hidden rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-400 lg:inline-flex">
        {t("nav.account")}
      </span>
    );
  }

  if (authState.status === "authenticated") {
    return (
      <div className="hidden items-center gap-3 lg:flex">
        <span className="max-w-36 truncate text-sm font-medium text-stone-700">
          {authState.user.full_name}
        </span>
        <button
          type="button"
          onClick={() => {
            clearAccessToken();
            setAuthState({ status: "guest", user: null });
          }}
          className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
        >
          {t("nav.signOut")}
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="hidden rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:border-stone-950 hover:text-stone-950 lg:inline-flex"
    >
      {t("nav.login")}
    </Link>
  );
}
