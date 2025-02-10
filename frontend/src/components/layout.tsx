import { Box } from "@mui/material";
import { Outlet } from "@tanstack/react-router";
import { NavBar, NavbarSettingsContextProvider } from "./navbar";
import { PageTitle } from "./page_title";

const Layout = () => {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
            }}
        >
            <PageTitle title="Snail Orbit" />

            <NavbarSettingsContextProvider>
                <Box display="flex" flexDirection="column" flex={1}>
                    <NavBar />

                    <Outlet />
                </Box>
            </NavbarSettingsContextProvider>
        </Box>
    );
};

export { Layout };
