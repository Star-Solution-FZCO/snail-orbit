import CloseIcon from "@mui/icons-material/Close";
import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
} from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { CreateCustomFieldT, CustomFieldGroupT } from "shared/model/types";
import { customFieldsApi } from "shared/model";
import { toastApiError } from "shared/utils";
import { CustomFieldForm } from "../custom_field_form";

interface ICreateCustomFieldFormDialogProps {
    open: boolean;
    customFieldGroup: CustomFieldGroupT;
    onClose: () => void;
}

export const CreateCustomFieldFormDialog: FC<
    ICreateCustomFieldFormDialogProps
> = ({ open, customFieldGroup, onClose }) => {
    const { t } = useTranslation();

    const [createCustomField, { isLoading }] =
        customFieldsApi.useCreateCustomFieldMutation();

    const onSubmit = (formData: CreateCustomFieldT) => {
        const isNumber = ["integer", "float"].includes(customFieldGroup.type);

        createCustomField({
            ...formData,
            gid: customFieldGroup.gid,
            default_value: isNumber
                ? Number(formData.default_value)
                : formData.default_value,
        })
            .unwrap()
            .then(() => {
                onClose();
                toast.success(t("customFields.create.success"));
            })
            .catch(toastApiError);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap={1}
            >
                {t("customFields.bundles.add")}

                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Box mt={1}>
                    <CustomFieldForm
                        onSubmit={onSubmit}
                        onCancel={onClose}
                        type={customFieldGroup.type}
                        loading={isLoading}
                    />
                </Box>
            </DialogContent>
        </Dialog>
    );
};
