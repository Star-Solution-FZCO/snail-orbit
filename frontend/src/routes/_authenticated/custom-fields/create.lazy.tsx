import { createLazyFileRoute } from "@tanstack/react-router";
import { CustomFieldCreate } from "modules";

export const Route = createLazyFileRoute(
    "/_authenticated/custom-fields/create",
)({
    component: CustomFieldCreate,
});
