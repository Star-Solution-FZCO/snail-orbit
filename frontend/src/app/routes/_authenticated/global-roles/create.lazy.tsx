import { createLazyFileRoute } from "@tanstack/react-router";
import { GlobalRoleCreate } from "modules";

export const Route = createLazyFileRoute("/_authenticated/global-roles/create")(
    {
        component: GlobalRoleCreate,
    },
);
