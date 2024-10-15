import { createLazyFileRoute } from "@tanstack/react-router";
import { DraftView } from "modules";

export const Route = createLazyFileRoute("/_authenticated/draft/$draftId")({
    component: DraftView,
});
