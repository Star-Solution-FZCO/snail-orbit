import { createLazyFileRoute } from "@tanstack/react-router";
import { GlobalRoleList } from "modules";

export const Route = createLazyFileRoute("/_authenticated/global-roles/")({
    component: GlobalRoleList,
});
