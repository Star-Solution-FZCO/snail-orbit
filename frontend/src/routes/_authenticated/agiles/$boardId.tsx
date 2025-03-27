import { createFileRoute } from "@tanstack/react-router";
import { AgileBoardView } from "modules";
import { IssueModalViewContextProvider } from "modules/issues/widgets/modal_view/modal_view_provider";

type BoardViewSearch = {
    query?: string;
};

export const Route = createFileRoute("/_authenticated/agiles/$boardId")({
    component: () => (
        <IssueModalViewContextProvider>
            <AgileBoardView />
        </IssueModalViewContextProvider>
    ),
    validateSearch: (search: Record<string, unknown>): BoardViewSearch => {
        return search as BoardViewSearch;
    },
});
