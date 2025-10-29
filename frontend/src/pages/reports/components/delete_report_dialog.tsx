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
import { reportApi } from "shared/model/api/report.api";
import { ReportT } from "shared/model/types/report";
import { toastApiError } from "shared/utils";

interface DeleteReportDialogProps {
    report: ReportT;
    open: boolean;
    onClose: () => void;
}

export const DeleteReportDialog: FC<DeleteReportDialogProps> = ({
    report,
    open,
    onClose,
}) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [deleteReport, { isLoading }] = reportApi.useDeleteReportMutation();

    const handleClickDelete = () => {
        deleteReport(report.id)
            .unwrap()
            .then(() => {
                onClose();
                toast.success(t("reports.delete.success"));
                navigate({ to: "/reports/list" });
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
                {t("reports.delete.title")}

                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {t("reports.delete.confirm", { name: report.name })}
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
