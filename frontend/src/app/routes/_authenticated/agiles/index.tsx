import { createFileRoute, redirect } from "@tanstack/react-router";
import { getFromLS } from "shared/utils/helpers/local-storage";

export const Route = createFileRoute("/_authenticated/agiles/")({
    component: () => <div />,
    beforeLoad: async () => {
        const boardId = getFromLS<string>("LAST_VIEW_BOARD");
        if (boardId) {
            throw redirect({ to: "/agiles/$boardId", params: { boardId } });
        } else {
            throw redirect({ to: "/agiles/list" });
        }
    },
});
