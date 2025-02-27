import {
    Box,
    Breadcrumbs,
    Container,
    Divider,
    Typography,
} from "@mui/material";
import { getRouteApi } from "@tanstack/react-router";
import { ErrorHandler, Link } from "components";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi } from "store";
import type { CustomFieldGroupT, UpdateCustomFieldT } from "types";
import { toastApiError } from "utils";
import { ConfirmChangesDialog } from "./components/confirm_changes_dialog";
import { CustomFieldGroupForm } from "./components/custom_field_group_form";
import { FieldList } from "./components/field_list";

const routeApi = getRouteApi(
    "/_authenticated/custom-fields/$customFieldGroupId",
);

const HeaderBreadcrumbs: FC<{
    customFieldGroup: CustomFieldGroupT;
    title: string;
}> = ({ customFieldGroup, title }) => {
    return (
        <Breadcrumbs sx={{ mb: 2 }}>
            <Link to="/custom-fields" underline="hover">
                <Typography fontSize={24} fontWeight="bold">
                    {title}
                </Typography>
            </Link>
            <Typography fontSize={24} fontWeight="bold">
                {customFieldGroup.name}
            </Typography>
        </Breadcrumbs>
    );
};

const CustomFieldGroupView = () => {
    const { t } = useTranslation();
    const { customFieldGroupId } = routeApi.useParams();

    const { data, error } =
        customFieldsApi.useGetCustomFieldGroupQuery(customFieldGroupId);

    const [updateCustomFieldGroup, { isLoading }] =
        customFieldsApi.useUpdateCustomFieldGroupMutation();

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

    const customFieldGroup = data.payload;

    const handleSubmit = (formData: UpdateCustomFieldT) => {
        if (!formData.default_value) formData.default_value = null;
        setFormData(formData);
        setConfirmDialogOpen(true);
    };

    const handleConfirm = () => {
        if (!formData) return;

        updateCustomFieldGroup({ gid: customFieldGroup.gid, ...formData })
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
                title={t("customFields.title")}
            />

            <Box display="flex" gap={2}>
                <Box flex={1} pt="44px">
                    <CustomFieldGroupForm
                        onSubmit={handleSubmit}
                        defaultValues={customFieldGroup}
                        loading={isLoading}
                    />
                </Box>

                <Divider orientation="vertical" flexItem />

                <Box flex={1}>
                    <FieldList
                        gid={customFieldGroup.gid}
                        fields={customFieldGroup.fields}
                    />
                </Box>
            </Box>

            <ConfirmChangesDialog
                open={confirmDialogOpen}
                onSubmit={handleConfirm}
                onClose={handleCloseConfirmDialog}
            />
        </Container>
    );
};

export { CustomFieldGroupView };
