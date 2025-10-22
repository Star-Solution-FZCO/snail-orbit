import { createFileRoute } from "@tanstack/react-router";
import type { IssueTemplateSearchParams } from "entities/issue/api/use_issue_template";
import { IssueDraft } from "pages/issues";

export const Route = createFileRoute("/_authenticated/issues/draft/$draftId")({
    component: Component,
    validateSearch: (
        search: Record<string, unknown>,
    ): IssueTemplateSearchParams => {
        return search as IssueTemplateSearchParams;
    },
});

function Component() {
    const { draftId } = Route.useParams();

    return <IssueDraft draftId={draftId} />;
}
