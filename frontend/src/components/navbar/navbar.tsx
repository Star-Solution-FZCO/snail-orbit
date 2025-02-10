import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import {
    Avatar,
    Box,
    IconButton,
    Menu,
    MenuItem,
    useTheme,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { About, Link } from "components/index";
import {
    FC,
    MouseEventHandler,
    PropsWithChildren,
    useMemo,
    useState,
} from "react";
import { useTranslation } from "react-i18next";
import { logout } from "services/auth";
import {
    logout as logoutAction,
    openAbout,
    useAppDispatch,
    useAppSelector,
} from "store";
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
    const { action } = useNavbarSettings();

    const links = useLinks();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    const handleClickSettings: MouseEventHandler<HTMLButtonElement> = (
        event,
    ) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleClickMenuItem = (path: string) => {
        navigate({
            to: path,
        });
        handleCloseMenu();
    };

    const handleLogout = async () => {
        logout();
        dispatch(logoutAction());
    };

    const handleAbout = () => {
        handleCloseMenu();
        dispatch(openAbout());
    };

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
                {user?.is_admin && (
                    <IconButton onClick={handleClickSettings} size="small">
                        <SettingsIcon />
                    </IconButton>
                )}

                <Link to="/profile">
                    <Avatar
                        sx={{ width: 32, height: 32 }}
                        src={user?.avatar}
                        variant="rounded"
                    />
                </Link>

                <IconButton onClick={handleLogout} size="small">
                    <LogoutIcon />
                </IconButton>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleCloseMenu}
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
                <MenuItem onClick={() => handleClickMenuItem("/users")}>
                    {t("navbar.users")}
                </MenuItem>
                <MenuItem onClick={handleAbout}>{t("navbar.about")}</MenuItem>
            </Menu>
            <About />
        </Box>
    );
};

export { NavBar };
