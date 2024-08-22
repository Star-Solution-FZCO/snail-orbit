import { createLazyFileRoute } from "@tanstack/react-router";
import { RoleList } from "modules";

export const Route = createLazyFileRoute("/_authenticated/roles/")({
    component: RoleList,
});
