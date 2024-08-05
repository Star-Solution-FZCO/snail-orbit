import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_authenticated/issues/")({
    component: () => <div>Hello /issues/!</div>,
});
