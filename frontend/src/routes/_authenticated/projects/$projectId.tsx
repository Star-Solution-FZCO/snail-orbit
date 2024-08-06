import { createFileRoute } from "@tanstack/react-router";
import { ProjectView } from "modules";

type ProjectViewSearch = {
    tab?: string;
};

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
    component: ProjectView,
    validateSearch: (search: Record<string, unknown>): ProjectViewSearch => {
        return search as ProjectViewSearch;
    },
});
