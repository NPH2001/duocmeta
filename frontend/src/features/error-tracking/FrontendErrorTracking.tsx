"use client";

import { useEffect } from "react";

import { onBrowserIdle } from "lib/browser-idle";
import { captureFrontendException, currentSafePath } from "lib/error-tracking";

export function FrontendErrorTracking() {
  useEffect(() => {
    let removeListeners: (() => void) | null = null;

    const cancelIdleRegistration = onBrowserIdle(() => {
      function handleError(event: ErrorEvent) {
        captureFrontendException(event.error ?? new Error("Unhandled browser error"), {
          component: "window.error",
          path: currentSafePath(),
          runtime: "browser",
          source: "global-listener",
        });
      }

      function handleUnhandledRejection(event: PromiseRejectionEvent) {
        captureFrontendException(event.reason, {
          component: "window.unhandledrejection",
          path: currentSafePath(),
          runtime: "browser",
          source: "global-listener",
        });
      }

      window.addEventListener("error", handleError);
      window.addEventListener("unhandledrejection", handleUnhandledRejection);

      removeListeners = () => {
        window.removeEventListener("error", handleError);
        window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      };
    });

    return () => {
      cancelIdleRegistration();
      removeListeners?.();
    };
  }, []);

  return null;
}
