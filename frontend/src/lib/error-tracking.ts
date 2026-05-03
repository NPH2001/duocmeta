export type ErrorTrackingContext = {
  component?: string;
  path?: string;
  runtime?: "browser" | "nextjs";
  source?: string;
};

type SafeContext = Record<string, string>;

const safeContextKeys = new Set(["component", "path", "runtime", "source"]);
const sensitiveKeyParts = ["address", "authorization", "cookie", "dsn", "email", "key", "password", "phone", "secret", "token"];

export function captureFrontendException(error: unknown, context: ErrorTrackingContext = {}): string {
  const eventId = createEventId();

  if (!isErrorTrackingEnabled()) {
    return eventId;
  }

  const safeContext = sanitizeFrontendContext(context);
  const errorName = error instanceof Error ? error.name : typeof error;
  const digest = isNextErrorWithDigest(error) ? error.digest : undefined;

  console.error("error_tracking_event", {
    eventId,
    provider: process.env.NEXT_PUBLIC_ERROR_TRACKING_PROVIDER ?? "console",
    errorName,
    digest,
    context: safeContext,
  });

  return eventId;
}

export function sanitizeFrontendContext(context: ErrorTrackingContext): SafeContext {
  return Object.fromEntries(
    Object.entries(context).filter(([key, value]) => {
      const normalizedKey = key.toLowerCase();
      return (
        typeof value === "string" &&
        safeContextKeys.has(normalizedKey) &&
        !sensitiveKeyParts.some((sensitivePart) => normalizedKey.includes(sensitivePart)) &&
        !sensitiveKeyParts.some((sensitivePart) => value.toLowerCase().includes(`${sensitivePart}=`))
      );
    })
  );
}

export function currentSafePath(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  return window.location.pathname || "/";
}

function isErrorTrackingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ERROR_TRACKING_ENABLED !== "false";
}

function createEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function isNextErrorWithDigest(error: unknown): error is Error & { digest: string } {
  return error instanceof Error && "digest" in error && typeof error.digest === "string";
}
