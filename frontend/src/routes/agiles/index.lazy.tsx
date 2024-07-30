import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/agiles/")({
    component: () => <div>Hello /agiles/!</div>,
});
