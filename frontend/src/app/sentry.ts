import * as Sentry from "@sentry/react";
import { SENTRY_DSN } from "./config";
import { router } from "./router";

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        sendDefaultPii: true,
        integrations: [
            Sentry.tanstackRouterBrowserTracingIntegration(router),
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        tracesSampleRate: 1.0,
        tracePropagationTargets: [/^\/api/],
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
    });
}
