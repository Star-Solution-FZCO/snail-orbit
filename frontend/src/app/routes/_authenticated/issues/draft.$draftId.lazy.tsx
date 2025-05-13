import { createLazyFileRoute } from "@tanstack/react-router";
import { IssueDraft } from "modules";

export const Route = createLazyFileRoute(
    "/_authenticated/issues/draft/$draftId",
)({
    component: Component,
});

function Component() {
    const { draftId } = Route.useParams();

    return <IssueDraft draftId={draftId} />;
}
