import { createFileRoute } from "@tanstack/react-router";
import { UserView } from "modules";

export const Route = createFileRoute("/_authenticated/users/$userId")({
    component: UserView,
});
