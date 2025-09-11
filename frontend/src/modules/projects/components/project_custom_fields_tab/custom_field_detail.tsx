import {
    Box,
    CircularProgress,
    Divider,
    Stack,
    Typography,
} from "@mui/material";
import { ConfirmCustomFieldChangesDialog } from "features/custom_fields/confirm_custom_field_changes_dialog";
import { CustomFieldForm } from "features/custom_fields/custom_field_form";
import { FieldTypeEditor } from "features/custom_fields/options_editors/field_type_editor";
import { useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi, useAppSelector } from "shared/model";
import { ProjectT, UpdateCustomFieldT } from "shared/model/types";
import { toastApiError } from "shared/utils";
import { FieldEditWarningDialog } from "./field_edit_warning_dialog";

export const CustomFieldDetail: FC<{
    customFieldId: string;
    project: ProjectT;
}> = ({ customFieldId, project }) => {
    const { t } = useTranslation();

    const isAdmin = useAppSelector(
        (state) => state.profile.user?.is_admin || false,
    );

    const [formData, setFormData] = useState<UpdateCustomFieldT | null>(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [warningDialogOpen, setWarningDialogOpen] = useState(false);
    const [isEditingEnabled, setIsEditingEnabled] = useState(false);

    const { data, isLoading, isFetching } =
        customFieldsApi.useGetCustomFieldQuery(customFieldId);

    const [updateCustomField] = customFieldsApi.useUpdateCustomFieldMutation();

    const customField = data?.payload;
    const isMultiProjectField = (customField?.projects?.length || 0) > 1;
    const canEditProject = project.access_claims.includes("project:update");
    const canEdit = isAdmin || canEditProject || !isMultiProjectField;

    const handleClickEdit = () => {
        if (!canEdit) return;

        if (isMultiProjectField && !isAdmin) {
            setWarningDialogOpen(true);
        } else {
            setIsEditingEnabled(true);
        }
    };

    const handleWarningConfirm = () => {
        setWarningDialogOpen(false);
        setIsEditingEnabled(true);
    };

    const handleSubmit = (formData: UpdateCustomFieldT) => {
        if (!formData.default_value) formData.default_value = null;
        setFormData(formData);
        setConfirmDialogOpen(true);
    };

    const handleConfirm = () => {
        if (!formData || !customField) return;

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
                setIsEditingEnabled(false);
            })
            .catch(toastApiError);
    };

    const handleCloseConfirmDialog = () => {
        setConfirmDialogOpen(false);
        setFormData(null);
    };

    const handleCancelEdit = () => {
        setIsEditingEnabled(false);
    };

    if (isLoading || isFetching)
        return (
            <Stack alignItems="center">
                <CircularProgress />
            </Stack>
        );

    if (!customField) {
        return null;
    }

    return (
        <Stack direction="row" gap={2}>
            <FieldEditWarningDialog
                open={warningDialogOpen}
                onConfirm={handleWarningConfirm}
                onClose={() => setWarningDialogOpen(false)}
                projectCount={customField.projects?.length || 0}
            />

            <ConfirmCustomFieldChangesDialog
                open={confirmDialogOpen}
                onSubmit={handleConfirm}
                onClose={handleCloseConfirmDialog}
                customFieldName={customField.name}
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
                    key={customField.id}
                    type={customField.type}
                    onEdit={
                        !isEditingEnabled && canEdit
                            ? handleClickEdit
                            : undefined
                    }
                    onSubmit={handleSubmit}
                    onCancel={isEditingEnabled ? handleCancelEdit : undefined}
                    defaultValues={customField}
                    loading={isLoading}
                    disabled={!isEditingEnabled}
                />
            </Stack>

            <Divider orientation="vertical" flexItem />

            <Box flex={1}>
                <FieldTypeEditor
                    customField={customField}
                    readOnly={!isEditingEnabled}
                />
            </Box>
        </Stack>
    );
};
