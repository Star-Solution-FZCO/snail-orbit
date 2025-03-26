import { CssBaseline, ThemeProvider } from "@mui/material";
import { RouterProvider } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Suspense } from "react";
import { Provider as StoreProvider } from "react-redux";
import { Slide, ToastContainer } from "react-toastify";
import { store } from "store";
import { theme } from "theme";
import { router } from "./router";

const App = () => {
    return (
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
    );
};

export default App;
