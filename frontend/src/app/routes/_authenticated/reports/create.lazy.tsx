import { createLazyFileRoute } from "@tanstack/react-router";
import { ReportsCreate } from "pages/reports/create";

export const Route = createLazyFileRoute("/_authenticated/reports/create")({
    component: RouteComponent,
});

function RouteComponent() {
    return <ReportsCreate />;
}
