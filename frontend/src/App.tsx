import { CssBaseline, ThemeProvider } from "@mui/material";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { ErrorFallback, NotFound } from "components";
import React, { Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Provider as StoreProvider } from "react-redux";
import { Slide, ToastContainer } from "react-toastify";
import { store } from "store";
import { theme } from "theme";
import { routeTree } from "./routeTree.gen";

const router = createRouter({
    routeTree,
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: ErrorFallback,
});

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
        <HelmetProvider>
            <ThemeProvider theme={theme}>
                <StoreProvider store={store}>
                    <CssBaseline />

                    <ToastContainer
                        position="bottom-right"
                        theme={theme.palette.mode}
                        transition={Slide}
                        closeOnClick
                        stacked
                    />

                    <RouterProvider router={router} />

                    <Suspense>
                        <TanStackRouterDevtools
                            router={router}
                            position="bottom-right"
                        />
                    </Suspense>
                </StoreProvider>
            </ThemeProvider>
        </HelmetProvider>
    );
};

export default App;
