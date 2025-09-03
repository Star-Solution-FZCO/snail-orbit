import { createLazyFileRoute } from "@tanstack/react-router";
import { AgileBoardList } from "pages/agile_boards";

export const Route = createLazyFileRoute("/_authenticated/agiles/list")({
    component: AgileBoardList,
});
