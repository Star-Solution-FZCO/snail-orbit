import { createLazyFileRoute } from "@tanstack/react-router";
import { WorkflowCreate } from "pages/workflows/create";

export const Route = createLazyFileRoute("/_authenticated/workflows/create")({
    component: WorkflowCreate,
});
