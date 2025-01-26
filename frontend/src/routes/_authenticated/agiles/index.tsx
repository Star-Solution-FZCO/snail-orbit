import { createFileRoute, redirect } from "@tanstack/react-router";
import { getLastViewBoardId } from "modules/agile_boards/utils/lastViewBoardStorage";
import { Routes } from "utils";

export const Route = createFileRoute("/_authenticated/agiles/")({
    component: () => <div />,
    beforeLoad: async () => {
        const boardId = getLastViewBoardId();
        if (boardId) {
            throw redirect({ to: Routes.agileBoards.board(boardId) });
        } else {
            throw redirect({ to: Routes.agileBoards.list() });
        }
    },
});
