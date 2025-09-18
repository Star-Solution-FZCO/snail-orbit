import { createFileRoute } from "@tanstack/react-router";
import { GlobalRoleView } from "pages/global_roles/view";

type Search = {
    tab?: string;
};

export const Route = createFileRoute(
    "/_authenticated/global-roles/$globalRoleId",
)({
    component: GlobalRoleView,
    validateSearch: (search: Record<string, unknown>): Search => {
        return search as Search;
    },
});
