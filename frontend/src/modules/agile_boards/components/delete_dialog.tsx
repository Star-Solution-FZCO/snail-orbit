import CloseIcon from "@mui/icons-material/Close";
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
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { agileBoardApi } from "store";
import { toastApiError } from "utils";

interface IDeleteAgileBoardDialogProps {
    id: string;
    open: boolean;
    onClose: () => void;
}

const DeleteAgileBoardDialog: FC<IDeleteAgileBoardDialogProps> = ({
    id,
    open,
    onClose,
}) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [deleteAgileBoard, { isLoading }] =
        agileBoardApi.useDeleteAgileBoardMutation();

    const handleClickDelete = () => {
        deleteAgileBoard(id)
            .unwrap()
            .then(() => {
                onClose();
                toast.success(t("agileBoards.delete.success"));
                navigate({ to: "/agiles" });
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
                {t("agileBoards.delete.title")}

                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {t("agileBoards.delete.confirm")}
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

                <Button
                    onClick={handleClickDelete}
                    variant="outlined"
                    loading={isLoading}
                >
                    {t("delete")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { DeleteAgileBoardDialog };
