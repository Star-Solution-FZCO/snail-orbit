import { createLazyFileRoute } from "@tanstack/react-router";
import { AgileBoardView } from "modules";

export const Route = createLazyFileRoute("/_authenticated/agiles/$boardId")({
    component: AgileBoardView,
});
