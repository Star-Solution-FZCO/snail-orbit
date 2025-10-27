import { createFileRoute } from "@tanstack/react-router";
import type { IssueTemplateSearchParams } from "entities/issue/api/use_issue_template";
import { IssueCreate } from "pages/issues";

export const Route = createFileRoute("/_authenticated/issues/create")({
    component: IssueCreate,
    validateSearch: (
        search: Record<string, unknown>,
    ): IssueTemplateSearchParams => {
        return search as IssueTemplateSearchParams;
    },
});
