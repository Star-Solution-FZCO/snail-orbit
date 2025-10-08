/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_EVENTS_URL: string;
    readonly VITE_APP_VERSION: string;
    readonly VITE_SENTRY_DSN: string;
    readonly VITE_SENTRY_ENVIRONMENT: string;
    readonly VITE_FAVICON_URL: string;
    readonly VITE_APP_TITLE: string;
    readonly VITE_APP_TITLE_PREFIX: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
