import { createLazyFileRoute } from "@tanstack/react-router";
import { CustomFieldGroupCreate } from "modules";

export const Route = createLazyFileRoute(
    "/_authenticated/custom-fields/create",
)({
    component: CustomFieldGroupCreate,
});
