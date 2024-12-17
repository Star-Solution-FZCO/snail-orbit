import { createLazyFileRoute } from "@tanstack/react-router";
import { UserCreate } from "modules";

export const Route = createLazyFileRoute("/_authenticated/users/create")({
    component: UserCreate,
});
