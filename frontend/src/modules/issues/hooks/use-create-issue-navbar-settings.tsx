import AddIcon from "@mui/icons-material/Add";
import type { MouseEventHandler } from "react";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { useIssueModalView } from "../widgets/modal_view/use_modal_view";

export const useCreateIssueNavbarSettings = () => {
    const { setAction } = useNavbarSettings();
    const { t, i18n } = useTranslation();
    const { createAndOpenIssueModal } = useIssueModalView();

    const handleClickCreate: MouseEventHandler<HTMLButtonElement> = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            createAndOpenIssueModal();
        },
        [createAndOpenIssueModal],
    );

    useEffect(() => {
        setAction(
            <Link to="/issues/create">
                <NavbarActionButton
                    onClick={handleClickCreate}
                    startIcon={<AddIcon />}
                >
                    {t("issues.new")}
                </NavbarActionButton>
            </Link>,
        );

        return () => setAction(null);
    }, [
        setAction,
        i18n.language,
        t,
        createAndOpenIssueModal,
        handleClickCreate,
    ]);
};
