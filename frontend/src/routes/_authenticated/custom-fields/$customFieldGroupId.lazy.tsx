import { createLazyFileRoute } from "@tanstack/react-router";
import { CustomFieldGroupView } from "modules";

export const Route = createLazyFileRoute(
    "/_authenticated/custom-fields/$customFieldGroupId",
)({
    component: Component,
});

function Component() {
    const { customFieldGroupId } = Route.useParams();

    return <CustomFieldGroupView customFieldGroupId={customFieldGroupId} />;
}
