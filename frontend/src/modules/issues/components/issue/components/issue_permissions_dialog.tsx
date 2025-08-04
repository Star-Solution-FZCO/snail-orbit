import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
} from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { IssueT } from "shared/model/types";
import { IssuePermissions } from "./issue_permissions";

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
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: 400 },
            }}
        >
            <DialogTitle>
                {t("issues.permissions.dialog.title", {
                    issueId: issue.id_readable,
                })}
            </DialogTitle>

            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <IssuePermissions issue={issue} />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>{t("cancel")}</Button>
            </DialogActions>
        </Dialog>
    );
};
