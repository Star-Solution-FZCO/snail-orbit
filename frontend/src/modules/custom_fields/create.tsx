import { Breadcrumbs, Container, Typography } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { ErrorHandler, Link, NotFound } from "components";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi, useAppSelector } from "store";
import { CreateCustomFieldT } from "types";
import { toastApiError } from "utils";
import { CustomFieldForm } from "./components/custom_field_form";

const routeApi = getRouteApi(
    "/_authenticated/custom-fields/$customFieldGroupId/fields/add",
);

const CustomFieldCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { customFieldGroupId } = routeApi.useParams();

    const isAdmin = useAppSelector((state) => state.profile.user?.is_admin);

    const { data, error } =
        customFieldsApi.useGetCustomFieldGroupQuery(customFieldGroupId);

    const [createCustomField, { isLoading }] =
        customFieldsApi.useCreateCustomFieldMutation();

    const onSubmit = (formData: CreateCustomFieldT) => {
        if (!data) return;

        createCustomField({
            gid: data.payload.gid,
            ...formData,
        })
            .unwrap()
            .then(() => {
                navigate({
                    to: "/custom-fields/$customFieldGroupId",
                    params: {
                        customFieldGroupId,
                    },
                });
                toast.success(t("customFields.fields.create.success"));
            })
            .catch(toastApiError);
    };

    if (!isAdmin) {
        return <NotFound />;
    }

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

    return (
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link to="/custom-fields" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("customFields.title")}
                    </Typography>
                </Link>
                <Link
                    to="/custom-fields/$customFieldGroupId"
                    params={{
                        customFieldGroupId,
                    }}
                    underline="hover"
                >
                    <Typography fontSize={24} fontWeight="bold">
                        {customFieldGroup.name}
                    </Typography>
                </Link>
                <Typography fontSize={24} fontWeight="bold">
                    {t("customFields.fields.add")}
                </Typography>
            </Breadcrumbs>

            <CustomFieldForm onSubmit={onSubmit} loading={isLoading} />
        </Container>
    );
};

export { CustomFieldCreate };
