import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import { Avatar, Box, IconButton } from "@mui/material";
import Link from "components/link.tsx";
import { useTranslation } from "react-i18next";
import { logout } from "services/auth";
import { logout as logoutAction, useAppDispatch } from "store";

const NavBar = () => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();

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
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
                <IconButton size="small">
                    <SettingsIcon />
                </IconButton>

                <Avatar sx={{ width: 32, height: 32 }} variant="rounded">
                    U
                </Avatar>

                <IconButton onClick={handleLogout} size="small">
                    <LogoutIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

export default NavBar;
