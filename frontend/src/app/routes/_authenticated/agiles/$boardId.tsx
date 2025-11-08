import { createFileRoute } from "@tanstack/react-router";
import { AgileBoardView } from "pages/agile_boards";
import { useCallback, useEffect } from "react";
import type { AgileBoardT } from "shared/model/types";
import { saveToLS } from "../../../../shared/utils/helpers/local-storage";

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

    const handleBoardSelect = useCallback(
        (board: AgileBoardT) => {
            navigate({ to: "/agiles/$boardId", params: { boardId: board.id } });
        },
        [navigate],
    );

    useEffect(() => {
        saveToLS("LAST_VIEW_BOARD", boardId);
    }, [boardId]);

    return (
        <AgileBoardView
            boardId={boardId}
            query={query}
            onQueryChange={handleQueryChange}
            onBoardSelect={handleBoardSelect}
        />
    );
}
