"use client";

import { useEffect, useState } from "react";

import { captureFrontendException, currentSafePath } from "lib/error-tracking";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    setEventId(
      captureFrontendException(error, {
        component: "app-error-boundary",
        path: currentSafePath(),
        runtime: "nextjs",
        source: "app/error.tsx",
      })
    );
  }, [error]);

  return (
    <section className="mx-auto max-w-3xl px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-bold text-slate-950">We could not load this page.</h1>
      <p className="mt-4 text-slate-600">
        The error was captured for review. No sensitive checkout, account, or payment details are shown here.
      </p>
      {eventId ? <p className="mt-3 text-sm text-slate-500">Reference: {eventId}</p> : null}
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Try again
      </button>
    </section>
  );
}
