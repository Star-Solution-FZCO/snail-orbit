declare global {
    interface Window {
        env?: {
            API_URL?: string;
            EVENTS_URL?: string;
            APP_VERSION?: string;
            SENTRY_DSN?: string;
            SENTRY_ENVIRONMENT?: string;
            FAVICON_URL?: string;
            APP_TITLE?: string;
            APP_TITLE_PREFIX?: string;
        };
    }
}

const DEFAULT_FAVICON_URL = import.meta.env.DEV
    ? "/favicon-pink.ico"
    : "/favicon.ico";
const DEFAULT_APP_PREFIX = import.meta.env.DEV ? "dev" : "";

// variables
export const API_URL =
    window?.env?.API_URL || import.meta.env.VITE_API_URL || "/api/";
export const EVENTS_URL =
    window?.env?.EVENTS_URL || import.meta.env.VITE_EVENTS_URL || "/events/";
export const APP_VERSION =
    window?.env?.APP_VERSION || import.meta.env.VITE_APP_VERSION || "__DEV__";
export const API_VERSION = "v1";
export const SENTRY_DSN =
    window?.env?.SENTRY_DSN || import.meta.env.VITE_SENTRY_DSN || "";
export const SENTRY_ENVIRONMENT =
    window?.env?.SENTRY_ENVIRONMENT ||
    import.meta.env.VITE_SENTRY_ENVIRONMENT ||
    "dev";
export const APP_TITLE_PREFIX =
    window?.env?.APP_TITLE_PREFIX ||
    import.meta.env.VITE_APP_TITLE_PREFIX ||
    DEFAULT_APP_PREFIX;
export const APP_TITLE =
    window?.env?.APP_TITLE || import.meta.env.VITE_APP_TITLE || "Snail Orbit";
export const FAVICON_URL =
    window?.env?.FAVICON_URL ||
    import.meta.env.VITE_FAVICON_URL ||
    DEFAULT_FAVICON_URL;

const setPageMeta = () => {
    document.title = APP_TITLE_PREFIX
        ? `[${APP_TITLE_PREFIX}] ${APP_TITLE}`
        : APP_TITLE;

    const links = document.querySelectorAll("link[rel*='icon']");

    links.forEach((link) => {
        (link as HTMLLinkElement).href = FAVICON_URL;
    });

    if (links.length === 0) {
        const link = document.createElement("link");
        link.type = "image/x-icon";
        link.href = FAVICON_URL;

        document.head.appendChild(link);
    }
};

setPageMeta();
