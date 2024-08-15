import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/issues/$issueId")({
    component: () => <div>Hello /_authenticated/issues/$issueId!</div>,
});
