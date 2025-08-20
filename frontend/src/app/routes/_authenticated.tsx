import { Box, Stack } from "@mui/material";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { IssueModalViewContextProvider } from "modules/issues/widgets/modal_view/modal_view_provider";
import { useAppSelector } from "shared/model";
import { NavBar, PageTitle } from "shared/ui";
import { NavbarSettingsContextProvider } from "shared/ui/navbar/navbar_settings";
import { QueryBuilderProvider } from "../../widgets/query_builder/query_builder_provider";
import { ToastContainerComp } from "../components/ToastContainer";

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
                display: "flex",
                minHeight: "100vh",
            }}
        >
            <PageTitle title="Snail Orbit" />

            <ToastContainerComp />

            <IssueModalViewContextProvider>
                <NavbarSettingsContextProvider>
                    <Stack flex={1}>
                        <NavBar />

                        <QueryBuilderProvider>
                            <Outlet />
                        </QueryBuilderProvider>
                    </Stack>
                </NavbarSettingsContextProvider>
            </IssueModalViewContextProvider>
        </Box>
    );
}
