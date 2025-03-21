import { createLazyFileRoute } from "@tanstack/react-router";
import { WorkflowList } from "modules";

export const Route = createLazyFileRoute("/_authenticated/workflows/")({
    component: WorkflowList,
});
