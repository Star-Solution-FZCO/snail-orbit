import { CssBaseline, ThemeProvider, useColorScheme } from "@mui/material";
import { RouterProvider } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Suspense } from "react";
import { Provider as StoreProvider } from "react-redux";
import { Slide, ToastContainer } from "react-toastify";
import { store } from "shared/model";
import { theme } from "shared/theme";
import { Lightbox } from "shared/ui";
import { router } from "./router";

const ToastContainerComp = () => {
    const { mode } = useColorScheme();

    return (
        <ToastContainer
            position="bottom-right"
            theme={mode}
            transition={Slide}
            closeOnClick
            stacked
        />
    );
};

const App = () => {
    return (
        <ThemeProvider theme={theme}>
            <StoreProvider store={store}>
                <CssBaseline />

                <ToastContainerComp />

                <Lightbox>
                    <RouterProvider router={router} />
                </Lightbox>

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
