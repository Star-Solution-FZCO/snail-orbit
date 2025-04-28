import { API_URL } from "app/config";

type ResetPasswordT = {
    reset_token: string;
    password: string;
};

export const passwordReset = async (resetFormData: ResetPasswordT) => {
    const url = API_URL + "auth/password-reset/set";
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(resetFormData),
    });

    const jsonResponse = await response.json();
    return response.ok ? jsonResponse : Promise.reject(jsonResponse);
};
