import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_authenticated/projects/$projectId")(
    {
        component: () => <div>Hello /projects/$projectId!</div>,
    },
);
