import LogoutIcon from "@mui/icons-material/Logout";
import { Avatar, Box, IconButton, useTheme } from "@mui/material";
import { Link } from "components";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { logout } from "services/auth";
import { logout as logoutAction, useAppDispatch, useAppSelector } from "store";

const links = [
    {
        to: "/issues",
        label: "navbar.issues",
    },
    {
        to: "/agiles",
        label: "navbar.agileBoards",
    },
    {
        to: "/projects",
        label: "navbar.projects",
    },
    {
        to: "/custom-fields",
        label: "navbar.customFields",
    },
];

interface INavBarLinkProps {
    to: string;
}

const NavBarLink: FC<INavBarLinkProps & React.PropsWithChildren> = ({
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
        >
            {children}
        </Link>
    );
};

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
                {links.map((link) => (
                    <NavBarLink key={link.to} to={link.to}>
                        {t(link.label)}
                    </NavBarLink>
                ))}
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

export { NavBar };
