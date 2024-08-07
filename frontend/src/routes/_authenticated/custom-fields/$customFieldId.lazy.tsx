import { createLazyFileRoute } from "@tanstack/react-router";
import { CustomFieldView } from "modules/custom_fields/view";

export const Route = createLazyFileRoute(
    "/_authenticated/custom-fields/$customFieldId",
)({
    component: CustomFieldView,
});
