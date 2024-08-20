import { createLazyFileRoute } from "@tanstack/react-router";
import { AgileBoardCreate } from "modules";

export const Route = createLazyFileRoute("/_authenticated/agiles/create")({
    component: AgileBoardCreate,
});
