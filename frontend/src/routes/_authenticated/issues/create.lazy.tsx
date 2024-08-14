import { createLazyFileRoute } from "@tanstack/react-router";
import IssueCreate from "modules/issues/create.tsx";

export const Route = createLazyFileRoute("/_authenticated/issues/create")({
    component: IssueCreate,
});
