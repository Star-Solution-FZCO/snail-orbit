import { Box, Stack } from "@mui/material";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { IssueModalViewContextProvider } from "modules/issues/widgets/modal_view/modal_view_provider";
import { useAppSelector } from "shared/model";
import { Lightbox, NavBar, PageTitle } from "shared/ui";
import { NavbarSettingsContextProvider } from "shared/ui/navbar/navbar_settings";
import { OffsideManagerProvider } from "../../shared/ui/offside_manager/offside_manager_provider";

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

            <Lightbox>
                <IssueModalViewContextProvider>
                    <NavbarSettingsContextProvider>
                        <Stack flex={1}>
                            <NavBar />

                            <OffsideManagerProvider>
                                <Outlet />
                            </OffsideManagerProvider>
                        </Stack>
                    </NavbarSettingsContextProvider>
                </IssueModalViewContextProvider>
            </Lightbox>
        </Box>
    );
}
