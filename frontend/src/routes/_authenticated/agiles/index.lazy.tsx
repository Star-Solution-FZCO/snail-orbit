import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_authenticated/agiles/")({
    component: () => <div>Hello /agiles/!</div>,
});
