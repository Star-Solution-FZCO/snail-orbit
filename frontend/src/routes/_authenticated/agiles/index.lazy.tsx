import { createLazyFileRoute } from "@tanstack/react-router";
import { AgileBoardList } from "modules";

export const Route = createLazyFileRoute("/_authenticated/agiles/")({
    component: AgileBoardList,
});
