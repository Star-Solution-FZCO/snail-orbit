import { Box, useTheme } from "@mui/material";
import type { FC, PropsWithChildren } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "shared/model";
import { Link } from "shared/ui";
import { AdminSettingsButton } from "./components/admin_settings_button";
import { UserMenuButton } from "./components/user_menu_button";
import { useNavbarSettings } from "./navbar_settings";

const useLinks = () => {
    const { t } = useTranslation();

    return useMemo(
        () => [
            {
                to: "/issues",
                label: t("navbar.issues"),
            },
            {
                to: "/agiles",
                label: t("navbar.agileBoards"),
            },
            {
                to: "/dashboards",
                label: t("navbar.dashboards"),
            },
            {
                to: "/projects",
                label: t("navbar.projects"),
            },
            {
                to: "/reports",
                label: t("navbar.reports"),
            },
        ],
        [t],
    );
};

interface INavBarLinkProps {
    to: string;
}

const NavBarLink: FC<INavBarLinkProps & PropsWithChildren> = ({
    to,
    children,
}) => {
    const theme = useTheme();

    return (
        <Link
            to={to}
            activeProps={{
                style: {
                    color: theme.palette.text.primary,
                },
            }}
            underline="hover"
        >
            {children}
        </Link>
    );
};

const NavBar = () => {
    const { t } = useTranslation();

    const user = useAppSelector((state) => state.profile.user);
    const { action } = useNavbarSettings();

    const links = useLinks();

    return (
        <Box
            display="flex"
            minHeight="64px"
            alignItems="center"
            justifyContent="space-between"
            px={4}
            zIndex={800}
        >
            <Box display="flex" alignItems="center" gap={4}>
                {links.map((link) => (
                    <NavBarLink key={link.to} to={link.to}>
                        {t(link.label)}
                    </NavBarLink>
                ))}

                {action}
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
                {user?.is_admin && <AdminSettingsButton />}

                <UserMenuButton />
            </Box>
        </Box>
    );
};

export { NavBar };
