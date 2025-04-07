import { Box, Breadcrumbs, Divider, Stack, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { ErrorHandler, Link } from "components";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi } from "store";
import type { CustomFieldGroupT, UpdateCustomFieldGroupT } from "types";
import { toastApiError } from "utils";
import { ConfirmChangesDialog } from "./components/confirm_changes_dialog";
import { CustomFieldEditView } from "./components/custom_field_edit_view";
import { CustomFieldGroupForm } from "./components/custom_field_group_form";
import { FieldList } from "./components/field_list";
import { CreateCustomFieldFormDialog } from "./components/form_dialogs/add_custom_field_form_dialog";

type CustomFieldGroupViewProps = {
    customFieldGroupId: string;
};

const HeaderBreadcrumbs: FC<{
    customFieldGroup: CustomFieldGroupT;
    title: string;
}> = ({ customFieldGroup, title }) => {
    return (
        <Breadcrumbs>
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

export const CustomFieldGroupView: FC<CustomFieldGroupViewProps> = (props) => {
    const { customFieldGroupId } = props;

    const { t } = useTranslation();
    const navigate = useNavigate();

    const { data, error } =
        customFieldsApi.useGetCustomFieldGroupQuery(customFieldGroupId);

    const [updateCustomFieldGroup, { isLoading }] =
        customFieldsApi.useUpdateCustomFieldGroupMutation();

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);
    const [formData, setFormData] = useState<UpdateCustomFieldGroupT | null>(
        null,
    );
    const [selectedCustomFieldId, setSelectedCustomFieldId] = useState<
        string | null
    >(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSelectedCustomFieldId(null);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

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

    const handleSubmit = (formData: UpdateCustomFieldGroupT) => {
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

    const handleClickCustomField = (customFieldId: string) => {
        setSelectedCustomFieldId(
            selectedCustomFieldId === customFieldId ? null : customFieldId,
        );
    };

    const handleAfterDelete = async () => {
        setSelectedCustomFieldId(null);
        if (customFieldGroup.fields.length === 1) {
            await navigate({ to: ".." });
        }
    };

    return (
        <Stack px={4} pb={4} gap={2} height={1}>
            <HeaderBreadcrumbs
                customFieldGroup={customFieldGroup}
                title={t("customFields.title")}
            />

            <Box display="flex" gap={2}>
                <Box flex={1}>
                    <CustomFieldGroupForm
                        onSubmit={handleSubmit}
                        defaultValues={customFieldGroup}
                        loading={isLoading}
                    />
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box flex={1}>
                    <FieldList
                        fields={customFieldGroup.fields}
                        selectedFieldId={selectedCustomFieldId}
                        onFieldClick={handleClickCustomField}
                        onClickAdd={() => setAddFieldDialogOpen(true)}
                    />
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box flex={2}>
                    {selectedCustomFieldId && (
                        <CustomFieldEditView
                            customFieldGroup={customFieldGroup}
                            customFieldId={selectedCustomFieldId}
                            onDelete={handleAfterDelete}
                        />
                    )}
                </Box>
            </Box>

            <ConfirmChangesDialog
                open={confirmDialogOpen}
                onSubmit={handleConfirm}
                onClose={handleCloseConfirmDialog}
            />

            <CreateCustomFieldFormDialog
                open={addFieldDialogOpen}
                customFieldGroup={customFieldGroup}
                onClose={() => setAddFieldDialogOpen(false)}
            />
        </Stack>
    );
};
