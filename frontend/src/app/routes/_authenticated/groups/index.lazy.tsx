import { createLazyFileRoute } from "@tanstack/react-router";
import { GroupList } from "pages/groups/list";

export const Route = createLazyFileRoute("/_authenticated/groups/")({
    component: GroupList,
});
