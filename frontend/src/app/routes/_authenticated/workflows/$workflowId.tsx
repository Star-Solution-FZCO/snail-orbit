import { createFileRoute } from "@tanstack/react-router";
import { WorkflowView } from "pages/workflows/view";

export const Route = createFileRoute("/_authenticated/workflows/$workflowId")({
    component: WorkflowView,
});
