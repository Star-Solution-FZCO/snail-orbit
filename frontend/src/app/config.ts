declare global {
    interface Window {
        env?: {
            API_URL?: string;
            EVENTS_URL?: string;
            APP_VERSION?: string;
            ENVIRONMENT?: string;
            SENTRY_DSN?: string;
        };
    }
}

const META_CONFIG = {
    dev: {
        title: "[dev] Snail Orbit",
        favicon: "/favicon-dev.ico",
    },
    test: {
        title: "[test] Snail Orbit",
        favicon: "/favicon-test.ico",
    },
    prod: {
        title: "Snail Orbit",
        favicon: "/favicon.ico",
    },
} as const;

type Environment = keyof typeof META_CONFIG;

const getEnvironment = (): Environment => {
    const env = (window?.env?.ENVIRONMENT ||
        import.meta.env.VITE_ENVIRONMENT) as Environment;

    if (env && env in META_CONFIG) {
        return env;
    }

    // fallback
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "dev";
    }
    if (hostname.includes("test")) {
        return "test";
    }

    return "prod";
};

export const ENVIRONMENT = getEnvironment();

const metaConfig = META_CONFIG[ENVIRONMENT];

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
export const APP_TITLE = metaConfig.title;
export const FAVICON_URL = metaConfig.favicon;

const setPageMeta = () => {
    document.title = APP_TITLE;

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
