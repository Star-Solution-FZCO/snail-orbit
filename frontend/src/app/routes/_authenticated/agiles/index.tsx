import { createFileRoute, redirect } from "@tanstack/react-router";
import { getLastViewBoardId } from "modules/agile_boards/utils/lastViewBoardStorage";

export const Route = createFileRoute("/_authenticated/agiles/")({
    component: () => <div />,
    beforeLoad: async () => {
        const boardId = getLastViewBoardId();
        if (boardId) {
            throw redirect({ to: "/agiles/$boardId", params: { boardId } });
        } else {
            throw redirect({ to: "/agiles/list" });
        }
    },
});
