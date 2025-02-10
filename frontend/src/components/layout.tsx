import { Box } from "@mui/material";
import { Outlet } from "@tanstack/react-router";
import { NavBar, NavbarSettingsContextProvider } from "./navbar";

const Layout = () => {
    return (
        <Box
            sx={{
                display: "flex",
                minHeight: "100vh",
                flexDirection: "column",
            }}
        >
            <NavbarSettingsContextProvider>
                <NavBar />

                <Outlet />
            </NavbarSettingsContextProvider>
        </Box>
    );
};

export { Layout };
