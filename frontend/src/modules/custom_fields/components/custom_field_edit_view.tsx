import { Box, Divider, Typography } from "@mui/material";
import { ErrorHandler } from "components";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi } from "store";
import type { CustomFieldGroupT, UpdateCustomFieldT } from "types";
import { toastApiError } from "utils";
import { ConfirmChangesDialog } from "./confirm_changes_dialog";
import { CustomFieldForm } from "./custom_field_form";
import { DeleteCustomFieldGroupDialog } from "./delete_custom_field_group_dialog";
import { FieldTypeEditor } from "./options_editors/field_type_editor";
import { isComplexCustomFieldType } from "./utils";

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
    const [deleteCustomField, { isLoading: isDeleting }] =
        customFieldsApi.useDeleteCustomFieldMutation();

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
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

            <ConfirmChangesDialog
                open={confirmDialogOpen}
                onSubmit={handleConfirm}
                onClose={handleCloseConfirmDialog}
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
