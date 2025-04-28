import { createFileRoute } from "@tanstack/react-router";
import { GroupView } from "modules";

type GroupViewSearch = {
    tab?: string;
};

export const Route = createFileRoute("/_authenticated/groups/$groupId")({
    component: GroupView,
    validateSearch: (search: Record<string, unknown>): GroupViewSearch => {
        return search as GroupViewSearch;
    },
});
