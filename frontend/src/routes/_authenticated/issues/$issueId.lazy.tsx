import { createLazyFileRoute } from "@tanstack/react-router";
import IssueView from "modules/issues/pages/view.tsx";

export const Route = createLazyFileRoute("/_authenticated/issues/$issueId")({
    component: IssueView,
});
