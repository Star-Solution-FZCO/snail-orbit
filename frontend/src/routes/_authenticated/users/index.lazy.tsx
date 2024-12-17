import { createLazyFileRoute } from "@tanstack/react-router";
import { UserList } from "modules";

export const Route = createLazyFileRoute("/_authenticated/users/")({
    component: UserList,
});
