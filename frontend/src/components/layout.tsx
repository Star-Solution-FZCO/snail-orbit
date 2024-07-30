import { Box } from "@mui/material";
import { Outlet } from "@tanstack/react-router";
import NavBar from "./navbar";

const Layout = () => {
    return (
        <Box display="flex" flexDirection="column" height="100%">
            <NavBar />

            <Outlet />
        </Box>
    );
};

export { Layout };
