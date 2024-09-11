import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import {
    Avatar,
    Box,
    Button,
    IconButton,
    Menu,
    MenuItem,
    useTheme,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "components";
import { FC, PropsWithChildren, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { logout } from "services/auth";
import { logout as logoutAction, useAppDispatch, useAppSelector } from "store";

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
                to: "/projects",
                label: t("navbar.projects"),
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
        >
            {children}
        </Link>
    );
};

const NavBar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const user = useAppSelector((state) => state.profile.user);

    const links = useLinks();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    const handleClickSettings = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClickMenuItem = (path: string) => {
        navigate({
            to: path,
        });
        handleClose();
    };

    const handleLogout = async () => {
        logout();
        dispatch(logoutAction());
    };

    return (
        <Box
            display="flex"
            minHeight="64px"
            alignItems="center"
            justifyContent="space-between"
            px={4}
        >
            <Box display="flex" alignItems="center" gap={4}>
                {links.map((link) => (
                    <NavBarLink key={link.to} to={link.to}>
                        {t(link.label)}
                    </NavBarLink>
                ))}

                <Link to="/issues/create">
                    <Button
                        sx={{ height: "24px", py: 0, textTransform: "none" }}
                        startIcon={<AddIcon />}
                        variant="contained"
                        size="small"
                    >
                        {t("issues.new")}
                    </Button>
                </Link>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
                {user?.is_admin && (
                    <IconButton onClick={handleClickSettings} size="small">
                        <SettingsIcon />
                    </IconButton>
                )}

                <Avatar sx={{ width: 32, height: 32 }} variant="rounded" src={user?.avatar} />
                <IconButton onClick={handleLogout} size="small">
                    <LogoutIcon />
                </IconButton>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >
                <MenuItem onClick={() => handleClickMenuItem("/custom-fields")}>
                    {t("navbar.customFields")}
                </MenuItem>
                <MenuItem onClick={() => handleClickMenuItem("/groups")}>
                    {t("navbar.groups")}
                </MenuItem>
                <MenuItem onClick={() => handleClickMenuItem("/roles")}>
                    {t("navbar.roles")}
                </MenuItem>
            </Menu>
        </Box>
    );
};

export { NavBar };
