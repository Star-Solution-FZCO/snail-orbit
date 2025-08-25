import { createLazyFileRoute } from "@tanstack/react-router";
import { IssueView } from "modules";

export const Route = createLazyFileRoute("/_authenticated/issues/$issueId/{-$subject}")({
    component: Component,
});

function Component() {
    const { issueId } = Route.useParams();

    return <IssueView issueId={issueId} />;
}
