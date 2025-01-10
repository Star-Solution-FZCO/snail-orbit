export const API_URL =
    (window as any)?.env?.API_URL || import.meta.env.VITE_API_URL || "/api/";
export const appVersion =
    (window as any)?.env?.APP_VERSION ||
    import.meta.env.VITE_APP_VERSION ||
    "__DEV__";

export const apiVersion = "v1";
