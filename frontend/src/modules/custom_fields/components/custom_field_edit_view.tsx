import { Box, Divider, Typography } from "@mui/material";
import { ConfirmCustomFieldChangesDialog } from "features/custom_fields/confirm_custom_field_changes_dialog";
import { CustomFieldForm } from "features/custom_fields/custom_field_form";
import { FieldTypeEditor } from "features/custom_fields/options_editors/field_type_editor";
import { isComplexCustomFieldType } from "features/custom_fields/utils";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi } from "shared/model";
import type { CustomFieldGroupT, UpdateCustomFieldT } from "shared/model/types";
import { ErrorHandler } from "shared/ui";
import { toastApiError } from "shared/utils";
import { CopyCustomFieldDialog } from "./copy_custom_field_dialog";
import { DeleteCustomFieldGroupDialog } from "./delete_custom_field_group_dialog";

interface ICustomFieldEditViewProps {
    customFieldGroup: CustomFieldGroupT;
    customFieldId: string;
    onDelete: () => void;
}

export const CustomFieldEditView: FC<ICustomFieldEditViewProps> = ({
    customFieldGroup,
    customFieldId,
    onDelete,
}) => {
    const { t } = useTranslation();

    const { data, error } =
        customFieldsApi.useGetCustomFieldQuery(customFieldId);

    const [updateCustomField, { isLoading }] =
        customFieldsApi.useUpdateCustomFieldMutation();
    const [copyCustomField, { isLoading: isCopying }] =
        customFieldsApi.useCopyCustomFieldMutation();
    const [deleteCustomField, { isLoading: isDeleting }] =
        customFieldsApi.useDeleteCustomFieldMutation();

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [copyDialogOpen, setCopyDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [formData, setFormData] = useState<UpdateCustomFieldT | null>(null);

    if (error) {
        return (
            <ErrorHandler
                error={error}
                message="customFields.item.fetch.error"
            />
        );
    }

    if (!data) return null;

    const customField = data.payload;

    const handleSubmit = (formData: UpdateCustomFieldT) => {
        if (!formData.default_value) formData.default_value = null;
        setFormData(formData);
        setConfirmDialogOpen(true);
    };

    const handleDelete = () => {
        deleteCustomField({ gid: customFieldGroup.gid, id: customField.id })
            .unwrap()
            .then(() => {
                setDeleteDialogOpen(false);
                onDelete();
                toast.success(t("customFields.delete.success"));
            })
            .catch(toastApiError);
    };

    const handleConfirm = () => {
        if (!formData) return;

        const isNumber = ["integer", "float"].includes(customFieldGroup.type);

        updateCustomField({
            ...formData,
            gid: customFieldGroup.gid,
            id: customField.id,
            default_value: isNumber
                ? Number(formData.default_value)
                : formData.default_value,
        })
            .unwrap()
            .then(() => {
                toast.success(t("customFields.update.success"));
                setConfirmDialogOpen(false);
                setFormData(null);
            })
            .catch(toastApiError);
    };

    const handleCopy = (label: string) => {
        if (label.length === 0) return;

        copyCustomField({
            gid: customFieldGroup.gid,
            id: customField.id,
            label,
        })
            .unwrap()
            .then(() => {
                toast.success(t("customFields.copy.success"));
                setCopyDialogOpen(false);
            })
            .catch(toastApiError);
    };

    const handleCloseConfirmDialog = () => {
        setConfirmDialogOpen(false);
        setFormData(null);
    };

    return (
        <Box display="flex" gap={2}>
            <Box flex={1} display="flex" flexDirection="column" gap={1}>
                <Typography fontSize={20} fontWeight="bold" lineHeight={1.8}>
                    {t("customFields.bundle")}: {customField.name} (
                    {customField.label})
                </Typography>

                <CustomFieldForm
                    onSubmit={handleSubmit}
                    onDelete={() => setDeleteDialogOpen(true)}
                    onCopy={() => setCopyDialogOpen(true)}
                    defaultValues={customField}
                    type={customFieldGroup.type}
                    loading={isLoading}
                />
            </Box>

            {isComplexCustomFieldType(customField.type) && (
                <>
                    <Divider orientation="vertical" flexItem />

                    <Box flex={1}>
                        <FieldTypeEditor customField={customField} />
                    </Box>
                </>
            )}

            <ConfirmCustomFieldChangesDialog
                open={confirmDialogOpen}
                onSubmit={handleConfirm}
                onClose={handleCloseConfirmDialog}
            />

            <CopyCustomFieldDialog
                open={copyDialogOpen}
                onSubmit={handleCopy}
                onClose={() => setCopyDialogOpen(false)}
                loading={isCopying}
            />

            <DeleteCustomFieldGroupDialog
                open={deleteDialogOpen}
                onSubmit={handleDelete}
                onClose={() => setDeleteDialogOpen(false)}
                loading={isDeleting}
            />
        </Box>
    );
};
