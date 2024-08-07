import { createLazyFileRoute } from "@tanstack/react-router";
import { CustomFieldList } from "modules";

export const Route = createLazyFileRoute("/_authenticated/custom-fields/")({
    component: CustomFieldList,
});
