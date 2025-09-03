import { createLazyFileRoute } from "@tanstack/react-router";
import { GlobalRoleList } from "pages/global_roles/list";

export const Route = createLazyFileRoute("/_authenticated/global-roles/")({
    component: GlobalRoleList,
});
