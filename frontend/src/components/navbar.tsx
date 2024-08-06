import LogoutIcon from "@mui/icons-material/Logout";
import { Avatar, Box, IconButton } from "@mui/material";
import Link from "components/link.tsx";
import { useTranslation } from "react-i18next";
import { logout } from "services/auth";
import { logout as logoutAction, useAppDispatch, useAppSelector } from "store";

const NavBar = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const user = useAppSelector((state) => state.profile.user);

    const handleLogout = () => {
        logout()
            .then()
            .finally(() => {
                dispatch(logoutAction());
            });
    };

    return (
        <Box
            display="flex"
            minHeight="64px"
            alignItems="center"
            justifyContent="space-between"
            px={4}
        >
            <Box display="flex" gap={4}>
                <Link to="/issues">{t("navbar.issues")}</Link>
                <Link to="/agiles">{t("navbar.agileBoards")}</Link>
                <Link to="/projects">{t("navbar.projects")}</Link>
                <Link to="/fields">{t("navbar.fields")}</Link>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ width: 32, height: 32 }} variant="rounded">
                    {user?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                </Avatar>

                <IconButton onClick={handleLogout} size="small">
                    <LogoutIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

export default NavBar;
