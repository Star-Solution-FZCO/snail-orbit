import { createRouter } from "@tanstack/react-router";
import { ErrorFallback, NotFound } from "../shared/ui";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
    routeTree,
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: ErrorFallback,
});

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}
