import { createLazyFileRoute } from "@tanstack/react-router";
import { DashboardCreate } from "pages/dashboards/create";

export const Route = createLazyFileRoute("/_authenticated/dashboards/create")({
    component: RouteComponent,
});

function RouteComponent() {
    return <DashboardCreate />;
}
