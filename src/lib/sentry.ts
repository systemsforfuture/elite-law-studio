// Sentry-Integration. Wenn VITE_SENTRY_DSN nicht gesetzt: silent.

import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN;

export const isSentryEnabled = Boolean(dsn);

export const initSentry = () => {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1, // 10% tracing für production
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Ignoriere harmlose Errors
    beforeSend(event, hint) {
      const err = hint.originalException;
      if (err instanceof Error) {
        if (
          err.message.includes("ResizeObserver") ||
          err.message.includes("Network request failed")
        ) {
          return null;
        }
      }
      return event;
    },
  });
};

export const captureError = (e: unknown, ctx?: Record<string, unknown>) => {
  if (!isSentryEnabled) {
    console.error("[error]", e, ctx);
    return;
  }
  Sentry.captureException(e, { extra: ctx });
};

export const setUser = (
  user: { id: string; email?: string; tenant_id?: string } | null,
) => {
  if (!isSentryEnabled) return;
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
    if (user.tenant_id) Sentry.setTag("tenant_id", user.tenant_id);
  } else {
    Sentry.setUser(null);
  }
};

export const ErrorBoundary = Sentry.ErrorBoundary;
