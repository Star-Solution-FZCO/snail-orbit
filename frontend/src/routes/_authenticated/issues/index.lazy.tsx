import { createLazyFileRoute } from "@tanstack/react-router";
import IssuesList from "modules/issues/pages/list.tsx";

export const Route = createLazyFileRoute("/_authenticated/issues/")({
    component: IssuesList,
});
