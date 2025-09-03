import { createLazyFileRoute } from "@tanstack/react-router";
import { CustomFieldGroupCreate } from "pages/custom_fields";

export const Route = createLazyFileRoute(
    "/_authenticated/custom-fields/create",
)({
    component: CustomFieldGroupCreate,
});
