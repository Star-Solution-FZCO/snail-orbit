import { createLazyFileRoute } from "@tanstack/react-router";
import { ProjectCreate } from "modules";

export const Route = createLazyFileRoute("/_authenticated/projects/create")({
    component: ProjectCreate,
});
