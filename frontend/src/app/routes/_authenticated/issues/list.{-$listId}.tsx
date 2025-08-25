import { createFileRoute } from "@tanstack/react-router";
import type { IssueListQueryParams } from "modules";
import { IssueList } from "modules";
import { useCallback } from "react";
import { makeFalsyUndefined } from "shared/utils/helpers/make-falsy-undefined";
import { saveToLS } from "../../../../shared/utils/helpers/local-storage";

type IssueListSearch = {
    page?: number;
    query?: string;
    perPage?: number;
};

export const Route = createFileRoute("/_authenticated/issues/list/{-$listId}")({
    component: Component,
    validateSearch: (search: Record<string, unknown>): IssueListSearch => {
        return search as IssueListSearch;
    },
});

function Component() {
    const { listId } = Route.useParams();
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

    const handleListIdChanged = useCallback(
        (id: string) => {
            saveToLS("ISSUES_LIST_LAST_SEARCH", id);
            navigate({ params: { listId: id } });
        },
        [navigate],
    );

    return (
        <IssueList
            queryParams={search}
            onQueryParamsChanged={handleQueryParamsChanged}
            listId={listId}
            onChangeListId={handleListIdChanged}
        />
    );
}
