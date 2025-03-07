import { createFileRoute } from "@tanstack/react-router";
import { IssueList } from "modules";

type IssueListSearch = {
    page?: number;
    query?: string;
    perPage?: number;
};

export const Route = createFileRoute("/_authenticated/issues/")({
    component: IssueList,
    validateSearch: (search: Record<string, unknown>): IssueListSearch => {
        return search as IssueListSearch;
    },
});
