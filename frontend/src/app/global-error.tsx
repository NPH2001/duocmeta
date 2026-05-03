"use client";

import { useEffect, useState } from "react";

import { captureFrontendException, currentSafePath } from "lib/error-tracking";
import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    setEventId(
      captureFrontendException(error, {
        component: "global-error-boundary",
        path: currentSafePath(),
        runtime: "nextjs",
        source: "app/global-error.tsx",
      })
    );
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-slate-50 px-6 py-16 text-center text-slate-950">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Unexpected error</p>
          <h1 className="mt-3 text-3xl font-bold">A critical application error occurred.</h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-600">
            The issue was captured with a safe reference ID. Sensitive customer, order, payment, and credential data is
            not displayed in this error surface.
          </p>
          {eventId ? <p className="mt-3 text-sm text-slate-500">Reference: {eventId}</p> : null}
          <button
            type="button"
            onClick={reset}
            className="mt-8 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Reload application
          </button>
        </main>
      </body>
    </html>
  );
}
