import { createLazyFileRoute } from "@tanstack/react-router";
import { UserList } from "pages/users/list";

export const Route = createLazyFileRoute("/_authenticated/users/")({
    component: UserList,
});
