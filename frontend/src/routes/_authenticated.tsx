import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
    // beforeLoad: async ({ location }) => {
    //     // if (true) {
    //     throw redirect({
    //         to: "/login",
    //         search: {
    //             redirect: location.href,
    //         },
    //     });
    //     // }
    // },
});
