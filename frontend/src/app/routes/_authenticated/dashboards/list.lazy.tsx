import { createLazyFileRoute } from "@tanstack/react-router";
import { DashboardList } from "pages/dashboards";

export const Route = createLazyFileRoute("/_authenticated/dashboards/list")({
    component: DashboardList,
});
