import { CssBaseline, ThemeProvider } from "@mui/material";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import React, { Suspense } from "react";
import { Provider as StoreProvider } from "react-redux";
import { ToastContainer } from "react-toastify";
import { store } from "store";
import { theme } from "theme";
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
        <ThemeProvider theme={theme}>
            <StoreProvider store={store}>
                <CssBaseline />

                <ToastContainer
                    position="top-right"
                    theme={theme.palette.mode}
                    closeOnClick
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
    );
};

export default App;
