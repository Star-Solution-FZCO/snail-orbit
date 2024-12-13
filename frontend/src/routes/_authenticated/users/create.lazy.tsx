import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_authenticated/users/create")({
    component: () => <div>Hello /_authenticated/users/create!</div>,
});
