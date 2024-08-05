import { createLazyFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_authenticated/")({
    component: () => <Navigate to="/projects" />,
});
