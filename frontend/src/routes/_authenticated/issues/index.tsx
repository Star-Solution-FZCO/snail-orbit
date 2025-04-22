import { createFileRoute } from "@tanstack/react-router";
import type { IssueListQueryParams } from "modules";
import { IssueList } from "modules";
import { useCallback } from "react";
import { makeFalsyUndefined } from "utils/helpers/make-falsy-undefined";

type IssueListSearch = {
    page?: number;
    query?: string;
    perPage?: number;
};

export const Route = createFileRoute("/_authenticated/issues/")({
    component: Component,
    validateSearch: (search: Record<string, unknown>): IssueListSearch => {
        return search as IssueListSearch;
    },
});

function Component() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();

    const handleQueryParamsChanged = useCallback(
        (params: Partial<IssueListQueryParams>) => {
            navigate({
                search: (prev) => makeFalsyUndefined({ ...prev, ...params }),
            });
        },
        [navigate],
    );

    return (
        <IssueList
            queryParams={search}
            onQueryParamsChanged={handleQueryParamsChanged}
        />
    );
}
