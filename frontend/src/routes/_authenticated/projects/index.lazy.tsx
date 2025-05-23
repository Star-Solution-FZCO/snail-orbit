import { createLazyFileRoute } from "@tanstack/react-router";
import { ProjectList } from "modules";

export const Route = createLazyFileRoute("/_authenticated/projects/")({
    component: ProjectList,
});
