import { createLazyFileRoute } from "@tanstack/react-router";
import { ProjectList } from "pages/projects/list";

export const Route = createLazyFileRoute("/_authenticated/projects/")({
    component: ProjectList,
});
