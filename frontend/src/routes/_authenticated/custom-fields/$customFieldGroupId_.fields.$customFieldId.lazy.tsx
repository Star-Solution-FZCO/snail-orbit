import { createLazyFileRoute } from "@tanstack/react-router";
import { CustomFieldView } from "modules";

export const Route = createLazyFileRoute(
    "/_authenticated/custom-fields/$customFieldGroupId/fields/$customFieldId",
)({
    component: CustomFieldView,
});
