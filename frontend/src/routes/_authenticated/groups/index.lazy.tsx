import { createLazyFileRoute } from "@tanstack/react-router";
import { GroupList } from "modules";

export const Route = createLazyFileRoute("/_authenticated/groups/")({
    component: GroupList,
});
