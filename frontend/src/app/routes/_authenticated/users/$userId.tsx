import { createFileRoute } from "@tanstack/react-router";
import { UserView } from "pages/users/view";

type UserViewSearch = {
    tab?: string;
};

export const Route = createFileRoute("/_authenticated/users/$userId")({
    component: UserView,
    validateSearch: (search: Record<string, unknown>): UserViewSearch => {
        return search as UserViewSearch;
    },
});
