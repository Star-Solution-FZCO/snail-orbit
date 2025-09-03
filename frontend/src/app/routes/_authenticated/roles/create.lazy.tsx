import { createLazyFileRoute } from "@tanstack/react-router";
import { RoleCreate } from "pages/roles/create";

export const Route = createLazyFileRoute("/_authenticated/roles/create")({
    component: RoleCreate,
});
