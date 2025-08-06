import CloseIcon from "@mui/icons-material/Close";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { IssueT } from "shared/model/types";
import { IssuePermissionsList } from "./issue_permissions_list";

type IssuePermissionsDialogProps = {
    issue: IssueT;
    open: boolean;
    onClose: () => void;
};

export const IssuePermissionsDialog: FC<IssuePermissionsDialogProps> = ({
    issue,
    open,
    onClose,
}) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                }}
            >
                {t("issues.access.management.title", {
                    issueId: issue.id_readable,
                })}

                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <IssuePermissionsList issue={issue} />
            </DialogContent>
        </Dialog>
    );
};
