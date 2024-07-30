import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/issues/")({
    component: () => <div>Hello /issues/!</div>,
});
