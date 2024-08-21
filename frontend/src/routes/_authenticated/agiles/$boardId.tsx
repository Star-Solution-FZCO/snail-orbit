import { createFileRoute } from "@tanstack/react-router";
import { AgileBoardView } from "modules";

export const Route = createFileRoute("/_authenticated/agiles/$boardId")({
    component: AgileBoardView,
});
