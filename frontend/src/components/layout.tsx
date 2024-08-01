import { Box } from "@mui/material";
import { Outlet } from "@tanstack/react-router";
import NavBar from "./navbar";

const Layout = () => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                height: "100vh",
                backgroundColor: (theme) => theme.palette.background.content,
            }}
        >
            <NavBar />
            <Outlet />
        </Box>
    );
};

export { Layout };
