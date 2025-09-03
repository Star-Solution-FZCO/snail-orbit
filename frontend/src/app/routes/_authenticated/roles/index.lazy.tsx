import { createLazyFileRoute } from "@tanstack/react-router";
import { RoleList } from "pages/roles/list";

export const Route = createLazyFileRoute("/_authenticated/roles/")({
    component: RoleList,
});
