import { createLazyFileRoute } from "@tanstack/react-router";
import { GroupCreate } from "modules";

export const Route = createLazyFileRoute("/_authenticated/groups/create")({
    component: GroupCreate,
});
