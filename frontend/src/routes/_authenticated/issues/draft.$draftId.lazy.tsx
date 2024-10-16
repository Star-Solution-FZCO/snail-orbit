import { createLazyFileRoute } from "@tanstack/react-router";
import { IssueDraft } from "modules";

export const Route = createLazyFileRoute(
    "/_authenticated/issues/draft/$draftId",
)({
    component: IssueDraft,
});
