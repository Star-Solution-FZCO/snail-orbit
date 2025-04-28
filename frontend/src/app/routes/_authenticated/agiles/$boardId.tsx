import { createFileRoute } from "@tanstack/react-router";
import { AgileBoardView } from "modules";
import { IssueModalViewContextProvider } from "modules/issues/widgets/modal_view/modal_view_provider";
import { useCallback } from "react";
import type { AgileBoardT } from "../../../../shared/model/types";

type BoardViewSearch = {
    query?: string;
};

export const Route = createFileRoute("/_authenticated/agiles/$boardId")({
    component: Component,
    validateSearch: (search: Record<string, unknown>): BoardViewSearch => {
        return search as BoardViewSearch;
    },
});

function Component() {
    const { boardId } = Route.useParams();
    const { query } = Route.useSearch();
    const navigate = Route.useNavigate();

    const handleQueryChange = useCallback(
        (query: string) => {
            navigate({ search: { query: query || undefined } });
        },
        [navigate],
    );

    const handleGoToList = useCallback(() => {
        navigate({ to: "/agiles/list" });
    }, [navigate]);

    const handleBoardSelect = useCallback(
        (board: AgileBoardT) => {
            navigate({ to: "/agiles/$boardId", params: { boardId: board.id } });
        },
        [navigate],
    );

    return (
        <IssueModalViewContextProvider>
            <AgileBoardView
                boardId={boardId}
                query={query}
                onQueryChange={handleQueryChange}
                onGoToList={handleGoToList}
                onBoardSelect={handleBoardSelect}
            />
        </IssueModalViewContextProvider>
    );
}
