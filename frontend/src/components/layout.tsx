import { Box } from "@mui/material";
import { Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { setUser, useAppDispatch, userApi } from "store";
import { NavBar } from "./navbar";

const Layout = () => {
    const dispatch = useAppDispatch();

    const { data: profile } = userApi.useGetProfileQuery();

    useEffect(() => {
        if (profile) {
            dispatch(setUser(profile.payload));
        }
    }, [profile]);

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
