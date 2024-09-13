import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi } from "store";
import { toastApiError } from "utils";

interface IDeleteIssueDialogProps {
    id: string;
    open: boolean;
    onClose: () => void;
}

const DeleteIssueDialog: FC<IDeleteIssueDialogProps> = ({
    id,
    open,
    onClose,
}) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [deleteIssue, { isLoading }] = issueApi.useDeleteIssueMutation();

    const handleClickDelete = () => {
        deleteIssue(id)
            .unwrap()
            .then(() => {
                onClose();
                toast.success(t("issues.delete.success"));
                navigate({ to: "/issues" });
            })
            .catch(toastApiError);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("issues.delete.title")}

                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {t("issues.delete.warning")}
                </DialogContentText>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    disabled={isLoading}
                >
                    {t("cancel")}
                </Button>

                <LoadingButton
                    onClick={handleClickDelete}
                    variant="outlined"
                    loading={isLoading}
                >
                    {t("delete")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export { DeleteIssueDialog };
