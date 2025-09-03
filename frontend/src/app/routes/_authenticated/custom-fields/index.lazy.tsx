import { createLazyFileRoute } from "@tanstack/react-router";
import { CustomFieldList } from "pages/custom_fields";

export const Route = createLazyFileRoute("/_authenticated/custom-fields/")({
    component: CustomFieldList,
});
