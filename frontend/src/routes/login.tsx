import { createFileRoute } from "@tanstack/react-router";
import Auth from "modules/auth";

export const Route = createFileRoute("/login")({
    component: Auth,
});
