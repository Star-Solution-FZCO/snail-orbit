export const API_URL =
    (window as any)?.env?.API_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:9090/api/";

export const apiVersion = "v1";

export const defaultErrorMessage = "An error has occurred. Contact support";
