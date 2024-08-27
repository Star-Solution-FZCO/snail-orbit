import { createLazyFileRoute } from "@tanstack/react-router";
import { IssueList } from "modules";

export const Route = createLazyFileRoute("/_authenticated/issues/")({
    component: IssueList,
});
