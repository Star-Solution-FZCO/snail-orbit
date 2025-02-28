import { createFileRoute } from "@tanstack/react-router";
import { AgileBoardView } from "modules";

type BoardViewSearch = {
    query?: string;
};

export const Route = createFileRoute("/_authenticated/agiles/$boardId")({
    component: AgileBoardView,
    validateSearch: (search: Record<string, unknown>): BoardViewSearch => {
        return search as BoardViewSearch;
    },
});
