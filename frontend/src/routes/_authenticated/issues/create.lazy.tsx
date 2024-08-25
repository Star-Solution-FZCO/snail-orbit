import { createLazyFileRoute } from "@tanstack/react-router";
import IssueCreate from "modules/issues/pages/create";

export const Route = createLazyFileRoute("/_authenticated/issues/create")({
    component: IssueCreate,
});
