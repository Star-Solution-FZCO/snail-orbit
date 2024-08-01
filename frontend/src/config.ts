export const API_URL =
    (window as any)?.env?.API_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:9090/api/";

export const apiVersion = "v1";
