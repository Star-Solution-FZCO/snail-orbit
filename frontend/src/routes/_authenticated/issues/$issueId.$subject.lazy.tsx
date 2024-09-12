import { createLazyFileRoute } from "@tanstack/react-router";
import { IssueView } from "modules";

export const Route = createLazyFileRoute(
    "/_authenticated/issues/$issueId/$subject",
)({
    component: IssueView,
});
