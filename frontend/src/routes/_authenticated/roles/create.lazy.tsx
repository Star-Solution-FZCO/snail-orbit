import { createLazyFileRoute } from "@tanstack/react-router";
import { RoleCreate } from "modules";

export const Route = createLazyFileRoute("/_authenticated/roles/create")({
    component: RoleCreate,
});
