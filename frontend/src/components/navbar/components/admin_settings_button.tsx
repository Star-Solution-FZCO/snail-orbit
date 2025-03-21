import SettingsIcon from "@mui/icons-material/Settings";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { bindMenu, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export const AdminSettingsButton = memo(() => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const popupState = usePopupState({
        variant: "popover",
        popupId: "admin-settings-menu",
    });

    const handleClickMenuItem = (path: string) => {
        navigate({
            to: path,
        });
        popupState.close();
    };

    return (
        <>
            <IconButton size="small" {...bindTrigger(popupState)}>
                <SettingsIcon />
            </IconButton>

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
            </Menu>
        </>
    );
});

AdminSettingsButton.displayName = "AdminSettingsButton";
