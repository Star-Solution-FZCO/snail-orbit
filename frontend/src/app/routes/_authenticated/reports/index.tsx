import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/reports/")({
    component: () => <div />,
    beforeLoad: async () => {
        throw redirect({ to: "/reports/list" });

        // const boardId = getFromLS<string>("LAST_VIEW_BOARD");
        // if (boardId) {
        //     throw redirect({ to: "/agiles/$boardId", params: { boardId } });
        // } else {
        //     throw redirect({ to: "/agiles/list" });
        // }
    },
});
