import { createFileRoute } from "@tanstack/react-router";
import Auth from "modules/auth";

type AuthSearch = {
    redirect?: string;
};

export const Route = createFileRoute("/login")({
    component: Auth,
    validateSearch: (search: Record<string, unknown>): AuthSearch => {
        return search as AuthSearch;
    },
});
