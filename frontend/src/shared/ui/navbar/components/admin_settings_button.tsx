import SettingsIcon from "@mui/icons-material/Settings";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { bindMenu, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "shared/ui/link";

const links: { label: string; path: string }[] = [
    {
        label: "navbar.customFields",
        path: "/custom-fields",
    },
    {
        label: "navbar.globalRoles",
        path: "/global-roles",
    },
    {
        label: "navbar.groups",
        path: "/groups",
    },
    {
        label: "navbar.roles",
        path: "/roles",
    },
    {
        label: "navbar.users",
        path: "/users",
    },
    {
        label: "navbar.workflows",
        path: "/workflows",
    },
];

export const AdminSettingsButton = memo(() => {
    const { t } = useTranslation();

    const popupState = usePopupState({
        variant: "popover",
        popupId: "admin-settings-menu",
    });

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
                {links.map((link, index) => (
                    <Link
                        key={`admin-settings-button-${index + 1}`}
                        to={link.path}
                        underline="none"
                        color="inherit"
                    >
                        <MenuItem onClick={() => popupState.close()}>
                            {t(link.label)}
                        </MenuItem>
                    </Link>
                ))}
            </Menu>
        </>
    );
});

AdminSettingsButton.displayName = "AdminSettingsButton";
