import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/")({
    component: () => <div />,
    beforeLoad: async () => {
        throw redirect({ to: "/issues" });
    },
});
