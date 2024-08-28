import {
    Box,
    Breadcrumbs,
    Container,
    Divider,
    Typography,
} from "@mui/material";
import { getRouteApi } from "@tanstack/react-router";
import { Link } from "components";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi } from "store";
import { UpdateCustomFieldT } from "types";
import { toastApiError } from "utils";
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
            .catch(toastApiError);
    };

    return (
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <Breadcrumbs sx={{ mb: 2 }}>
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
                <Box flex={1} pt="44px">
                    <CustomFieldForm
                        onSubmit={onSubmit}
                        defaultValues={customField}
                        loading={isLoading}
                    />
                </Box>

                {["enum", "enum_multi"].includes(customField.type) && (
                    <>
                        <Divider
                            orientation="vertical"
                            sx={{ mt: "44px" }}
                            flexItem
                        />

                        <Box flex={1}>
                            <CustomFieldOptionsEditor
                                customField={customField}
                            />
                        </Box>
                    </>
                )}
            </Box>
        </Container>
    );
};

export { CustomFieldView };
