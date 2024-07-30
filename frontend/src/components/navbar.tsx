import SettingsIcon from "@mui/icons-material/Settings";
import { Avatar, Box, IconButton } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

const NavBar = () => {
    const { t } = useTranslation();

    return (
        <Box
            display="flex"
            minHeight="64px"
            alignItems="center"
            justifyContent="space-between"
            px={4}
        >
            <Box display="flex" gap={4}>
                <Link to="/issues">{t("NAVBAR:ISSUES")}</Link>
                <Link to="/agiles">{t("NAVBAR:AGILE_BOARDS")}</Link>
                <Link to="/projects">{t("NAVBAR:PROJECTS")}</Link>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
                <IconButton size="small">
                    <SettingsIcon />
                </IconButton>

                <Avatar sx={{ width: 32, height: 32 }} variant="rounded">
                    U
                </Avatar>
            </Box>
        </Box>
    );
};

export default NavBar;
