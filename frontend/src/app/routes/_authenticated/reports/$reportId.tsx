import { createFileRoute } from "@tanstack/react-router";
import { ReportView } from "pages/reports";

export const Route = createFileRoute("/_authenticated/reports/$reportId")({
    component: RouteComponent,
});

function RouteComponent() {
    const { reportId } = Route.useParams();

    return <ReportView reportId={reportId} />;
}
