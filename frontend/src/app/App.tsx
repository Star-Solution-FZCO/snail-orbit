import { CssBaseline, ThemeProvider } from "@mui/material";
import { RouterProvider } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Suspense } from "react";
import { Provider as StoreProvider } from "react-redux";
import { store } from "shared/model";
import { theme } from "shared/theme";
import { ToastContainerComp as ToastContainer } from "./components/ToastContainer";
import { router } from "./router";
import "./sentry";

const App = () => {
    return (
        <ThemeProvider theme={theme}>
            <StoreProvider store={store}>
                <CssBaseline />

                <ToastContainer />

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
