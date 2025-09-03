import { createLazyFileRoute } from "@tanstack/react-router";
import { GlobalRoleCreate } from "pages/global_roles/create";

export const Route = createLazyFileRoute("/_authenticated/global-roles/create")(
    {
        component: GlobalRoleCreate,
    },
);
