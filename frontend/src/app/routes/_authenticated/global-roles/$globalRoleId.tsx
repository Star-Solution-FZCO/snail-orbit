import { createFileRoute } from "@tanstack/react-router";
import { GlobalRoleView } from "pages/global_roles/view";
import { z } from "zod";

const globalRoleSearchSchema = z.object({
    tab: z.string().optional(),
});

export const Route = createFileRoute(
    "/_authenticated/global-roles/$globalRoleId",
)({
    component: GlobalRoleView,
    validateSearch: globalRoleSearchSchema,
});
