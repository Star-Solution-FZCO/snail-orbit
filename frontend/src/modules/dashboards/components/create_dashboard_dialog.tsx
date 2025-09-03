import CloseIcon from "@mui/icons-material/Close";
import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { dashboardApi } from "shared/model";
import { CreateDashboardT } from "shared/model/types";
import { toastApiError } from "shared/utils";
import { DashboardForm } from "./dashboard_form";

interface CreateDashboardDialogProps {
    open: boolean;
    onClose: () => void;
}

export const CreateDashboardDialog: FC<CreateDashboardDialogProps> = ({
    open,
    onClose,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [createDashboard, { isLoading }] =
        dashboardApi.useCreateDashboardMutation();

    const handleSubmit = (formData: CreateDashboardT) => {
        createDashboard(formData)
            .unwrap()
            .then((response) => {
                const newDashboard = response.payload;
                onClose();
                navigate({
                    to: "/dashboards/$dashboardId",
                    params: { dashboardId: newDashboard.id },
                });
                toast.success(t("dashboards.create.success"));
            })
            .catch(toastApiError);
    };

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
                {t("dashboards.new")}

                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Box mt={1}>
                    <DashboardForm
                        onSubmit={handleSubmit}
                        onCancel={onClose}
                        loading={isLoading}
                    />
                </Box>
            </DialogContent>
        </Dialog>
    );
};
