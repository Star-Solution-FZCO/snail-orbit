import { Box, Breadcrumbs, Divider, Typography } from "@mui/material";
import { getRouteApi } from "@tanstack/react-router";
import { Link } from "components";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi } from "store";
import { UpdateCustomFieldT } from "types";
import { CustomFieldForm } from "./components/custom_field_form";
import { CustomFieldOptionsEditor } from "./components/custom_field_options_editor";

const routeApi = getRouteApi("/_authenticated/custom-fields/$customFieldId");

const CustomFieldView = () => {
    const { t } = useTranslation();
    const { customFieldId } = routeApi.useParams();

    const { data } = customFieldsApi.useGetCustomFieldQuery(customFieldId);

    const [updateCustomField, { isLoading }] =
        customFieldsApi.useUpdateCustomFieldMutation();

    if (!data) return null;

    const customField = data.payload;

    const onSubmit = (formData: UpdateCustomFieldT) => {
        updateCustomField({
            id: customField.id,
            ...formData,
        })
            .unwrap()
            .then(() => {
                toast.success(t("customFields.update.success"));
            })
            .catch((error) => {
                toast.error(error.data.detail || t("error.default"));
            });
    };

    return (
        <Box display="flex" flexDirection="column" px={4} gap={2}>
            <Breadcrumbs>
                <Link to="/custom-fields" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("customFields.title")}
                    </Typography>
                </Link>
                <Typography fontSize={24} fontWeight="bold">
                    {customField.name}
                </Typography>
            </Breadcrumbs>

            <Box display="flex" gap={2}>
                <Box flex={1}>
                    <CustomFieldForm
                        onSubmit={onSubmit}
                        defaultValues={customField}
                        loading={isLoading}
                    />
                </Box>

                {["enum", "enum_multi"].includes(customField.type) && (
                    <>
                        <Divider orientation="vertical" flexItem />

                        <Box flex={1}>
                            <CustomFieldOptionsEditor
                                customField={customField}
                            />
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
};

export { CustomFieldView };
