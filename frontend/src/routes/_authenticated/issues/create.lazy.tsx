import { createLazyFileRoute } from "@tanstack/react-router";
import { IssueCreate } from "modules";

export const Route = createLazyFileRoute("/_authenticated/issues/create")({
    component: IssueCreate,
});
