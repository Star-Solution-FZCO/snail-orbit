import { createLazyFileRoute } from "@tanstack/react-router";
import { WorkflowList } from "pages/workflows/list";

export const Route = createLazyFileRoute("/_authenticated/workflows/")({
    component: WorkflowList,
});
