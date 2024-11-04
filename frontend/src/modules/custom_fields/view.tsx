import {
    Box,
    Breadcrumbs,
    Container,
    Divider,
    Typography,
} from "@mui/material";
import { getRouteApi } from "@tanstack/react-router";
import { ErrorHandler, Link } from "components";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi } from "store";
import { CustomFieldT, UpdateCustomFieldT } from "types";
import { toastApiError } from "utils";
import { ConfirmChangesDialog } from "./components/confirm_changes_dialog";
import { CustomFieldEnumOptionsEditor } from "./components/custom_field_enum_options_editor";
import { CustomFieldForm } from "./components/custom_field_form";
import { CustomFieldStateOptionsEditor } from "./components/custom_field_state_options_editor";
import { CustomFieldUserOptionsEditor } from "./components/custom_field_user_options_editor";
import { CustomFieldVersionOptionsEditor } from "./components/custom_field_version_options_editor";

const routeApi = getRouteApi("/_authenticated/custom-fields/$customFieldId");

const HeaderBreadcrumbs: FC<{ customField: CustomFieldT; title: string }> = ({
    customField,
    title,
}) => {
    return (
        <Breadcrumbs sx={{ mb: 2 }}>
            <Link to="/custom-fields" underline="hover">
                <Typography fontSize={24} fontWeight="bold">
                    {title}
                </Typography>
            </Link>
            <Typography fontSize={24} fontWeight="bold">
                {customField.name}
            </Typography>
        </Breadcrumbs>
    );
};

const isNonPrimitiveType = (customField: CustomFieldT) => {
    return (
        [
            "enum",
            "enum_multi",
            "user",
            "user_multi",
            "version",
            "version_multi",
        ].includes(customField.type) || customField.type === "state"
    );
};

const FieldTypeEditor: FC<{ customField: CustomFieldT }> = ({
    customField,
}) => {
    const isEnumType = ["enum", "enum_multi"].includes(customField.type);
    const isUserType = ["user", "user_multi"].includes(customField.type);
    const isVersionType = ["version", "version_multi"].includes(
        customField.type,
    );
    const isStateType = customField.type === "state";

    if (isEnumType) {
        return <CustomFieldEnumOptionsEditor customField={customField} />;
    }

    if (isUserType) {
        return <CustomFieldUserOptionsEditor customField={customField} />;
    }

    if (isVersionType) {
        return <CustomFieldVersionOptionsEditor customField={customField} />;
    }

    if (isStateType) {
        return <CustomFieldStateOptionsEditor customField={customField} />;
    }

    return null;
};

const CustomFieldView = () => {
    const { t } = useTranslation();
    const { customFieldId } = routeApi.useParams();

    const { data, error } =
        customFieldsApi.useGetCustomFieldQuery(customFieldId);

    const [updateCustomField, { isLoading }] =
        customFieldsApi.useUpdateCustomFieldMutation();

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
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
        setFormData(formData);
        setConfirmDialogOpen(true);
    };

    const handleConfirm = () => {
        if (!formData) return;

        updateCustomField({ id: customField.id, ...formData })
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
                customField={customField}
                title={t("customFields.title")}
            />

            <Box display="flex" gap={2}>
                <Box flex={1} pt={isNonPrimitiveType(customField) ? "44px" : 0}>
                    <CustomFieldForm
                        onSubmit={handleSubmit}
                        defaultValues={customField}
                        loading={isLoading}
                    />
                </Box>

                {isNonPrimitiveType(customField) && (
                    <>
                        <Divider
                            orientation="vertical"
                            sx={{ mt: "44px" }}
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
        </Container>
    );
};

export { CustomFieldView };
