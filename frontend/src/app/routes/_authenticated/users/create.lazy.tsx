import { createLazyFileRoute } from "@tanstack/react-router";
import { UserCreate } from "pages/users/create";

export const Route = createLazyFileRoute("/_authenticated/users/create")({
    component: UserCreate,
});
