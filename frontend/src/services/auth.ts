import { API_URL } from "config";

type CredentialsT = {
    login: string;
    password: string;
    remember: boolean;
};

export const authenticate = async (credentials: CredentialsT) => {
    const url = API_URL + "auth/login";
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include",
    });

    const jsonResponse = await response.json();

    return response.ok ? jsonResponse : Promise.reject(jsonResponse);
};

export const refreshToken = async () => {
    const url = API_URL + "auth/refresh";
    const response = await fetch(url, {
        credentials: "include",
    });

    const jsonResponse = await response.json();

    return response.ok ? jsonResponse : Promise.reject(jsonResponse);
};

export const logout = async () => {
    const url = API_URL + "auth/logout";
    await fetch(url, {
        credentials: "include",
    });
};
