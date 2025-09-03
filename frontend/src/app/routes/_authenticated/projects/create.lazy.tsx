import { createLazyFileRoute } from "@tanstack/react-router";
import { ProjectCreate } from "pages/projects/create";

export const Route = createLazyFileRoute("/_authenticated/projects/create")({
    component: ProjectCreate,
});
