import { createLazyFileRoute } from "@tanstack/react-router";
import { AgileBoardsDashboard } from "modules";

export const Route = createLazyFileRoute("/_authenticated/agiles/")({
    component: AgileBoardsDashboard,
});
