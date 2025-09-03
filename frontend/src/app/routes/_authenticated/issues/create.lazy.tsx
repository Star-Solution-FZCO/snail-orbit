import { createLazyFileRoute } from "@tanstack/react-router";
import { IssueCreate } from "pages/issues";

export const Route = createLazyFileRoute("/_authenticated/issues/create")({
    component: IssueCreate,
});
