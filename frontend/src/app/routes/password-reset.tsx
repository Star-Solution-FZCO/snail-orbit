import { createFileRoute } from "@tanstack/react-router";
import { PasswordReset } from "pages/auth/password_reset";

type PasswordResetSearch = {
    reset_token?: string;
};

export const Route = createFileRoute("/password-reset")({
    component: PasswordReset,
    validateSearch: (search: Record<string, unknown>): PasswordResetSearch => {
        return search as PasswordResetSearch;
    },
});
