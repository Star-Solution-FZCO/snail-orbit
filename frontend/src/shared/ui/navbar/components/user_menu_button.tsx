import { Info, Logout } from "@mui/icons-material";
import SettingsIcon from "@mui/icons-material/Settings";
import { Avatar, ListItemIcon, Menu, MenuItem } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { bindMenu, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { logout } from "shared/api/services/auth";
import {
    logout as logoutAction,
    useAppDispatch,
    useAppSelector,
} from "shared/model";
import { About } from "../../about";

export const UserMenuButton = memo(() => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.profile.user);
    const navigate = useNavigate();
    const { t } = useTranslation();
    const popupState = usePopupState({
        variant: "popover",
        popupId: "user-menu",
    });

    const [aboutOpen, setAboutOpen] = useState<boolean>(false);

    const handleLogout = async () => {
        logout();
        dispatch(logoutAction());
    };

    const handleClickMenuItem = (path: string) => {
        navigate({
            to: path,
        });
        popupState.close();
    };

    const handleClickAboutItem = () => {
        setAboutOpen(true);
        popupState.close();
    };

    return (
        <>
            <Avatar
                sx={{ width: 32, height: 32, cursor: "pointer" }}
                src={user?.avatar}
                variant="rounded"
                {...bindTrigger(popupState)}
            />

            <Menu
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                {...bindMenu(popupState)}
            >
                <MenuItem onClick={() => handleClickMenuItem("/profile")}>
                    <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    {t("navbar.settings")}
                </MenuItem>
                <MenuItem onClick={handleClickAboutItem}>
                    <ListItemIcon>
                        <Info fontSize="small" />
                    </ListItemIcon>
                    {t("navbar.about")}
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                    {" "}
                    <ListItemIcon>
                        <Logout fontSize="small" />
                    </ListItemIcon>
                    {t("navbar.logout")}
                </MenuItem>
            </Menu>

            <About open={aboutOpen} onClose={() => setAboutOpen(false)} />
        </>
    );
});
