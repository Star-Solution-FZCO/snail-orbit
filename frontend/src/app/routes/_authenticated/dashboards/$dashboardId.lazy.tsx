import { createLazyFileRoute } from "@tanstack/react-router";
import { DashboardView } from "modules";

export const Route = createLazyFileRoute(
    "/_authenticated/dashboards/$dashboardId",
)({
    component: Component,
});

function Component() {
    const { dashboardId } = Route.useParams();

    return <DashboardView dashboardId={dashboardId} />;
}
