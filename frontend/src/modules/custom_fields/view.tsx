import {
    Box,
    Breadcrumbs,
    Container,
    Divider,
    Typography,
} from "@mui/material";
import { getRouteApi } from "@tanstack/react-router";
import { Link } from "components";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi } from "store";
import { CustomFieldT, UpdateCustomFieldT } from "types";
import { formatErrorMessages, toastApiError } from "utils";
import { CustomFieldEnumOptionsEditor } from "./components/custom_field_enum_options_editor";
import { CustomFieldForm } from "./components/custom_field_form";
import { CustomFieldUserOptionsEditor } from "./components/custom_field_user_options_editor";

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

const ErrorContainer: FC<{ error: any }> = ({ error }) => {
    const { t } = useTranslation();
    return (
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <Typography fontSize={24} fontWeight="bold">
                {formatErrorMessages(error) ||
                    t("customFields.item.fetch.error")}
            </Typography>
        </Container>
    );
};

const CustomFieldView = () => {
    const { t } = useTranslation();
    const { customFieldId } = routeApi.useParams();

    const { data, error } =
        customFieldsApi.useGetCustomFieldQuery(customFieldId);

    const [updateCustomField, { isLoading }] =
        customFieldsApi.useUpdateCustomFieldMutation();

    if (error) {
        return <ErrorContainer error={error} />;
    }

    if (!data) return null;

    const customField = data.payload;

    const onSubmit = (formData: UpdateCustomFieldT) => {
        updateCustomField({ id: customField.id, ...formData })
            .unwrap()
            .then(() => toast.success(t("customFields.update.success")))
            .catch(toastApiError);
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
                        onSubmit={onSubmit}
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
        </Container>
    );
};

const isNonPrimitiveType = (customField: CustomFieldT) => {
    return (
        ["enum", "enum_multi", "user", "user_multi"].includes(
            customField.type,
        ) || customField.type === "state"
    );
};

const FieldTypeEditor: FC<{ customField: CustomFieldT }> = ({
    customField,
}) => {
    const isEnumType = ["enum", "enum_multi"].includes(customField.type);
    const isUserType = ["user", "user_multi"].includes(customField.type);

    if (isEnumType) {
        return <CustomFieldEnumOptionsEditor customField={customField} />;
    }

    if (isUserType) {
        return <CustomFieldUserOptionsEditor customField={customField} />;
    }

    return null;
};

export { CustomFieldView };
