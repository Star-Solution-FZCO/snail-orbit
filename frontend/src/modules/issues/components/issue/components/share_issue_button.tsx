import ShareIcon from "@mui/icons-material/Share";
import { IconButton, Tooltip } from "@mui/material";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { IssueT } from "shared/model/types";
import { IssuePermissionsDialog } from "./issue_permissions_dialog";

type ShareIssueButtonProps = {
    issue: IssueT;
};

export const ShareIssueButton: FC<ShareIssueButtonProps> = ({ issue }) => {
    const { t } = useTranslation();
    const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);

    const canManagePermissions =
        issue.access_claims?.includes("issue:manage_permissions") || false;

    if (!canManagePermissions) {
        return null;
    }

    return (
        <>
            <Tooltip title={t("issues.permissions.share.title")}>
                <IconButton
                    onClick={() => setPermissionsDialogOpen(true)}
                    size="small"
                >
                    <ShareIcon />
                </IconButton>
            </Tooltip>

            <IssuePermissionsDialog
                issue={issue}
                open={permissionsDialogOpen}
                onClose={() => setPermissionsDialogOpen(false)}
            />
        </>
    );
};
