import { createLazyFileRoute } from "@tanstack/react-router";
import { AgileBoardCreate } from "pages/agile_boards";

export const Route = createLazyFileRoute("/_authenticated/agiles/create")({
    component: AgileBoardCreate,
});
