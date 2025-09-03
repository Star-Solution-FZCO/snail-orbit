import { createLazyFileRoute } from "@tanstack/react-router";
import { DashboardList } from "modules";

export const Route = createLazyFileRoute("/_authenticated/dashboards/list")({
    component: DashboardList,
});
