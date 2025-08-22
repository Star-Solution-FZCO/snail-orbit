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
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { projectApi } from "shared/model";
import { CustomFieldOutput } from "shared/model/types/backend-schema.gen";
import { toastApiError } from "shared/utils";

interface IRemoveProjectCustomFieldDialogProps {
    open: boolean;
    projectId: string;
    customField: CustomFieldOutput | null;
    onClose: () => void;
}

export const RemoveProjectCustomFieldDialog: FC<
    IRemoveProjectCustomFieldDialogProps
> = ({ open, projectId, customField, onClose }) => {
    const { t } = useTranslation();

    const [removeProjectCustomField, { isLoading }] =
        projectApi.useRemoveProjectCustomFieldMutation();

    const handleClickRemove = () => {
        if (!customField) return;

        removeProjectCustomField({
            id: projectId,
            customFieldId: customField.id,
        })
            .unwrap()
            .then(() => {
                toast.success(t("projects.customFields.remove.success"));
                onClose();
            })
            .catch(toastApiError);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("projects.customFields.remove.title")} "{customField?.name}"?
                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {t("projects.customFields.remove.warning")}
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
                    onClick={handleClickRemove}
                    variant="outlined"
                    loading={isLoading}
                >
                    {t("projects.customFields.remove.title")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
