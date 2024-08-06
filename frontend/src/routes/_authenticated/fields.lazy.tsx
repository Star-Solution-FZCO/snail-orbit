import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_authenticated/fields")({
    component: () => <div>Hello /_authenticated/fields!</div>,
});
