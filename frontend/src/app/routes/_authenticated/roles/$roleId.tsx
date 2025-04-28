import { createFileRoute } from "@tanstack/react-router";
import { RoleView } from "modules";

type RoleViewSearch = {
    tab?: string;
};

export const Route = createFileRoute("/_authenticated/roles/$roleId")({
    component: RoleView,
    validateSearch: (search: Record<string, unknown>): RoleViewSearch => {
        return search as RoleViewSearch;
    },
});
