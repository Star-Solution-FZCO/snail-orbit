declare global {
    interface Window {
        env?: {
            API_URL?: string;
            EVENTS_URL?: string;
            APP_VERSION?: string;
        };
    }
}

export const API_URL =
    window?.env?.API_URL || import.meta.env.VITE_API_URL || "/api/";
export const EVENTS_URL =
    window?.env?.EVENTS_URL || import.meta.env.VITE_EVENTS_URL || "/events/";
export const appVersion =
    window?.env?.APP_VERSION || import.meta.env.VITE_APP_VERSION || "__DEV__";

export const apiVersion = "v1";
