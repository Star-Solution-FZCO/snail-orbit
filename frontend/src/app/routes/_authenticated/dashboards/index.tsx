import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardList } from "modules";
import { getFromLS } from "shared/utils/helpers/local-storage";

export const Route = createFileRoute("/_authenticated/dashboards/")({
    component: DashboardList,
    beforeLoad: async () => {
        const dashboardId = getFromLS<string>("LAST_VIEW_DASHBOARD");

        if (dashboardId) {
            throw redirect({
                to: "/dashboards/$dashboardId",
                params: { dashboardId },
            });
        } else {
            throw redirect({ to: "/dashboards/list" });
        }
    },
});
