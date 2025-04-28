import { Menu, MenuItem } from "@mui/material";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { useIssueModalView } from "../../issues/widgets/modal_view/use_modal_view";

export const useViewNavbarSettings = () => {
    const { setAction } = useNavbarSettings();
    const { t, i18n } = useTranslation();
    const { createAndOpenIssueModal } = useIssueModalView();

    useEffect(() => {
        setAction(
            <PopupState popupId="agiles-menu-button" variant="popover">
                {(popupState) => (
                    <>
                        <NavbarActionButton {...bindTrigger(popupState)}>
                            {t("agileBoards.navbarButton")}
                        </NavbarActionButton>
                        <Menu
                            {...bindMenu(popupState)}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "center",
                            }}
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "center",
                            }}
                        >
                            <Link
                                to="/agiles/create"
                                underline="none"
                                color="textPrimary"
                            >
                                <MenuItem>{t("agileBoards.new")}</MenuItem>
                            </Link>
                            <MenuItem onClick={createAndOpenIssueModal}>
                                {t("issues.new")}
                            </MenuItem>
                        </Menu>
                    </>
                )}
            </PopupState>,
        );

        return () => setAction(null);
    }, [setAction, i18n.language, t, createAndOpenIssueModal]);
};
