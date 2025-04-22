import { Box } from "@mui/material";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { NavBar, PageTitle } from "components";
import { NavbarSettingsContextProvider } from "components/navbar/navbar_settings";
import { IssueModalViewContextProvider } from "modules/issues/widgets/modal_view/modal_view_provider";
import { useAppSelector } from "store";

export const Route = createFileRoute("/_authenticated")({
    component: Component,
});

function Component() {
    const { user } = useAppSelector((state) => state.profile);

    if (!user) {
        return (
            <Navigate
                to="/login"
                search={{
                    redirect:
                        location.pathname !== "/"
                            ? location.pathname
                            : undefined,
                }}
            />
        );
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
            }}
        >
            <PageTitle title="Snail Orbit" />

            <IssueModalViewContextProvider>
                <NavbarSettingsContextProvider>
                    <Box display="flex" flexDirection="column" flex={1}>
                        <NavBar />

                        <Outlet />
                    </Box>
                </NavbarSettingsContextProvider>
            </IssueModalViewContextProvider>
        </Box>
    );
}
