import { createLazyFileRoute } from "@tanstack/react-router";
import { GroupCreate } from "pages/groups/create";

export const Route = createLazyFileRoute("/_authenticated/groups/create")({
    component: GroupCreate,
});
