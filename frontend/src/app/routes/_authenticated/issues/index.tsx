import { createFileRoute, redirect } from "@tanstack/react-router";
import { getFromLS } from "shared/utils/helpers/local-storage";

export const Route = createFileRoute("/_authenticated/issues/")({
    component: () => <div />,
    beforeLoad: async () => {
        const lastSearch = getFromLS<string>("ISSUES_LIST_LAST_SEARCH");
        throw redirect({
            to: "/issues/list/{-$listId}",
            params: { listId: lastSearch || undefined },
        });
    },
});
