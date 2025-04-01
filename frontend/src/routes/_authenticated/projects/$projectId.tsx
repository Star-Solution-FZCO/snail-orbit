import { createFileRoute } from "@tanstack/react-router";
import { ProjectView } from "modules";
import type { ProjectFormTabKey } from "modules/projects/utils";
import { useCallback } from "react";

type ProjectViewSearch = {
    tab?: ProjectFormTabKey;
};

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
    component: Component,
    validateSearch: (search: Record<string, unknown>): ProjectViewSearch => {
        return search as ProjectViewSearch;
    },
});

function Component() {
    const { projectId } = Route.useParams();
    const navigate = Route.useNavigate();
    const { tab } = Route.useSearch();

    const handleTabChange = useCallback(
        (tab: ProjectFormTabKey) => {
            navigate({ search: { tab } });
        },
        [navigate],
    );

    return (
        <ProjectView
            projectId={projectId}
            tab={tab}
            onTabChange={handleTabChange}
        />
    );
}
