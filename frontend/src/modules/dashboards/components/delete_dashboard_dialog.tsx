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
import { dashboardApi } from "shared/model/api/dashboard.api";
import { DashboardT } from "shared/model/types";
import { toastApiError } from "shared/utils";
import { saveToLS } from "shared/utils/helpers/local-storage";

interface DeleteDashboardDialogProps {
    dashboard: DashboardT;
    open: boolean;
    onClose: () => void;
}

export const DeleteDashboardDialog: FC<DeleteDashboardDialogProps> = ({
    dashboard,
    open,
    onClose,
}) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [deleteDashboard, { isLoading }] =
        dashboardApi.useDeleteDashboardMutation();

    const handleClickDelete = () => {
        deleteDashboard(dashboard.id)
            .unwrap()
            .then(() => {
                onClose();
                toast.success(t("dashboards.delete.success"));
                saveToLS("LAST_VIEW_DASHBOARD", null);
                navigate({ to: "/dashboards/list" });
            })
            .catch(toastApiError);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("dashboards.delete.title")}

                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {t("dashboards.delete.confirm", { name: dashboard.name })}
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
