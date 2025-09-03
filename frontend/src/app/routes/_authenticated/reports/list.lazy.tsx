import { createLazyFileRoute } from "@tanstack/react-router";
import { ReportsList } from "pages/reports/list";

export const Route = createLazyFileRoute("/_authenticated/reports/list")({
    component: RouteComponent,
});

function RouteComponent() {
    return <ReportsList />;
}
