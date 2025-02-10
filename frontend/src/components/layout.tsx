import { Box } from "@mui/material";
import { Outlet } from "@tanstack/react-router";
import { NavBar, NavbarSettingsContextProvider } from "./navbar";
import { PageTitle } from "./page_title";

const Layout = () => {
    return (
        <Box
            sx={{
                display: "flex",
                minHeight: "100vh",
                flexDirection: "column",
            }}
        >
            <PageTitle title="Snail Orbit" />

            <NavbarSettingsContextProvider>
                <NavBar />

                <Outlet />
            </NavbarSettingsContextProvider>
        </Box>
    );
};

export { Layout };
