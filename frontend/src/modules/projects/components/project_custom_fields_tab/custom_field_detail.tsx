import { Box, Divider, LinearProgress, Stack, Typography } from "@mui/material";
import { ConfirmCustomFieldChangesDialog } from "features/custom_fields/confirm_custom_field_changes_dialog";
import { CustomFieldForm } from "features/custom_fields/custom_field_form";
import { FieldTypeEditor } from "features/custom_fields/options_editors/field_type_editor";
import { useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi } from "shared/model";
import { UpdateCustomFieldT } from "shared/model/types";
import { toastApiError } from "shared/utils";

export const CustomFieldDetail: FC<{ customFieldId: string }> = ({
    customFieldId,
}) => {
    const { t } = useTranslation();

    const [formData, setFormData] = useState<UpdateCustomFieldT | null>(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const { data, isLoading, isFetching } =
        customFieldsApi.useGetCustomFieldQuery(customFieldId);

    const [updateCustomField] = customFieldsApi.useUpdateCustomFieldMutation();

    const handleSubmit = (formData: UpdateCustomFieldT) => {
        if (!formData.default_value) formData.default_value = null;
        setFormData(formData);
        setConfirmDialogOpen(true);
    };

    const handleConfirm = () => {
        if (!formData) return;

        const isNumber = ["integer", "float"].includes(customField.type);

        updateCustomField({
            ...formData,
            gid: customField.gid,
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

    if (isLoading || isFetching) <LinearProgress />;

    if (!data) {
        return null;
    }

    const customField = data.payload;

    return (
        <Stack direction="row" gap={2}>
            <ConfirmCustomFieldChangesDialog
                open={confirmDialogOpen}
                onSubmit={handleConfirm}
                onClose={handleCloseConfirmDialog}
            />

            <Stack flex={1} gap={1}>
                <Typography fontSize={20} fontWeight="bold" lineHeight={1.8}>
                    {customField.name}
                </Typography>

                <Typography>
                    <Typography component="span" fontWeight="bold">
                        {t("customFields.form.label")}:
                    </Typography>{" "}
                    <Typography component="span" color="info">
                        {customField.label}
                    </Typography>
                </Typography>

                <Typography mb={0.5}>
                    <Typography component="span" fontWeight="bold">
                        {t("customFields.fields.type")}:
                    </Typography>{" "}
                    <Typography component="span" color="info">
                        {customField.type}
                    </Typography>
                </Typography>

                <CustomFieldForm
                    onSubmit={handleSubmit}
                    defaultValues={customField}
                    type={customField.type}
                    loading={isLoading}
                />
            </Stack>

            <Divider orientation="vertical" flexItem />

            <Box flex={1}>
                <FieldTypeEditor customField={customField} />
            </Box>
        </Stack>
    );
};
