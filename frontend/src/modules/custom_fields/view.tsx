import {
    Box,
    Breadcrumbs,
    Container,
    Divider,
    Typography,
} from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { ErrorHandler, Link } from "components";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi } from "store";
import type {
    CustomFieldGroupT,
    CustomFieldT,
    UpdateCustomFieldT,
} from "types";
import { toastApiError } from "utils";
import { ConfirmChangesDialog } from "./components/confirm_changes_dialog";
import { CustomFieldForm } from "./components/custom_field_form";
import { DeleteCustomFieldGroupDialog } from "./components/delete_custom_field_group_dialog";
import { FieldTypeEditor } from "./components/options_editors/field_type_editor";
import { isComplexCustomFieldType } from "./components/utils";

const routeApi = getRouteApi(
    "/_authenticated/custom-fields/$customFieldGroupId/fields/$customFieldId",
);

const HeaderBreadcrumbs: FC<{
    customFieldGroup: CustomFieldGroupT;
    customField: CustomFieldT;
    title: string;
}> = ({ customFieldGroup, customField, title }) => {
    return (
        <Breadcrumbs sx={{ mb: 2 }}>
            <Link to="/custom-fields" underline="hover">
                <Typography fontSize={24} fontWeight="bold">
                    {title}
                </Typography>
            </Link>
            <Link
                to="/custom-fields/$customFieldGroupId"
                params={{
                    customFieldGroupId: customFieldGroup.gid,
                }}
                underline="hover"
            >
                <Typography fontSize={24} fontWeight="bold">
                    {customFieldGroup.name}
                </Typography>
            </Link>
            <Typography fontSize={24} fontWeight="bold">
                {customField.label}
            </Typography>
        </Breadcrumbs>
    );
};

export const CustomFieldView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { customFieldGroupId, customFieldId } = routeApi.useParams();

    const { data: cfgData, error: cfgError } =
        customFieldsApi.useGetCustomFieldGroupQuery(customFieldGroupId);
    const { data: cfData, error: cfError } =
        customFieldsApi.useGetCustomFieldQuery(customFieldId);

    const [updateCustomField, { isLoading }] =
        customFieldsApi.useUpdateCustomFieldMutation();
    const [deleteCustomField, { isLoading: isDeleting }] =
        customFieldsApi.useDeleteCustomFieldMutation();

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [formData, setFormData] = useState<UpdateCustomFieldT | null>(null);

    if (cfgError || cfError) {
        return (
            <ErrorHandler
                error={cfgError || cfError}
                message="customFields.item.fetch.error"
            />
        );
    }

    if (!cfgData || !cfData) return null;

    const customFieldGroup = cfgData.payload;
    const customField = cfData.payload;

    const handleSubmit = (formData: UpdateCustomFieldT) => {
        if (!formData.default_value) formData.default_value = null;
        setFormData(formData);
        setConfirmDialogOpen(true);
    };

    const handleDelete = () => {
        deleteCustomField({ gid: customFieldGroup.gid, id: customField.id })
            .unwrap()
            .then(() => {
                navigate({
                    to: "/custom-fields",
                });
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
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <HeaderBreadcrumbs
                customFieldGroup={customFieldGroup}
                customField={customField}
                title={t("customFields.title")}
            />

            <Box display="flex" gap={2}>
                <Box
                    flex={1}
                    pt={isComplexCustomFieldType(customField.type) ? "44px" : 0}
                >
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
                        <Divider
                            sx={{ mt: "44px" }}
                            orientation="vertical"
                            flexItem
                        />

                        <Box flex={1}>
                            <FieldTypeEditor customField={customField} />
                        </Box>
                    </>
                )}
            </Box>

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
        </Container>
    );
};
