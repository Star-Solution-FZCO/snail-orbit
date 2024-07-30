import { CssBaseline } from "@mui/material";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import React, { Suspense } from "react";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}

const TanStackRouterDevtools =
    import.meta.env.MODE === "production"
        ? () => null
        : React.lazy(() =>
              import("@tanstack/router-devtools").then((res) => ({
                  default: res.TanStackRouterDevtools,
              })),
          );

const App = () => {
    return (
        <>
            <CssBaseline />

            <RouterProvider router={router} />

            <Suspense>
                <TanStackRouterDevtools router={router} />
            </Suspense>
        </>
    );
};

export default App;
