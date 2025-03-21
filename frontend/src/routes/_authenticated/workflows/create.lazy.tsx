import { createLazyFileRoute } from "@tanstack/react-router";
import { WorkflowCreate } from "modules";

export const Route = createLazyFileRoute("/_authenticated/workflows/create")({
    component: WorkflowCreate,
});
