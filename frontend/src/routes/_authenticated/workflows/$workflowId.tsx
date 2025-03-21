import { createFileRoute } from "@tanstack/react-router";
import { WorkflowView } from "modules";

export const Route = createFileRoute("/_authenticated/workflows/$workflowId")({
    component: WorkflowView,
});
