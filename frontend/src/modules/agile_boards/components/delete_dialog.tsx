import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
import { Box, Button, IconButton, Modal, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { agileBoardApi } from "store";

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
            .catch((error) => {
                toast.error(error.data.detail || t("error.default"));
            });
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={(theme) => ({
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: theme.palette.background.paper,
                    p: 4,
                    boxShadow: 16,
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                })}
            >
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography fontSize={20} fontWeight="bold">
                        {t("agileBoards.delete.title")}
                    </Typography>

                    <IconButton
                        onClick={onClose}
                        size="small"
                        disabled={isLoading}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Typography>{t("agileBoards.delete.confirm")}</Typography>

                <Box display="flex" gap={1}>
                    <LoadingButton
                        onClick={handleClickDelete}
                        variant="outlined"
                        loading={isLoading}
                    >
                        {t("agileBoards.delete.title")}
                    </LoadingButton>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        color="error"
                        disabled={isLoading}
                    >
                        {t("cancel")}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export { DeleteAgileBoardDialog };
