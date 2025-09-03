import { Breadcrumbs, Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { CustomFieldGroupForm } from "features/custom_fields/custom_field_group_form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi, useAppSelector } from "shared/model";
import type { CustomFieldGroupCreateBody } from "shared/model/types/backend-schema.gen";
import { Link, NotFound } from "shared/ui";
import { toastApiError } from "shared/utils";

const CustomFieldGroupCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const isAdmin = useAppSelector((state) => state.profile.user?.is_admin);

    const [createCustomFieldGroup, { isLoading }] =
        customFieldsApi.useCreateCustomFieldGroupMutation();

    const onSubmit = (formData: CustomFieldGroupCreateBody) => {
        createCustomFieldGroup(formData)
            .unwrap()
            .then((res) => {
                navigate({
                    to: "/custom-fields/$customFieldGroupId",
                    params: {
                        customFieldGroupId: res.payload.gid,
                    },
                });
                toast.success(t("customFields.create.success"));
            })
            .catch(toastApiError);
    };

    if (!isAdmin) {
        return <NotFound />;
    }

    return (
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link to="/custom-fields" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("customFields.title")}
                    </Typography>
                </Link>
                <Typography fontSize={24} fontWeight="bold">
                    {t("customFields.create.title")}
                </Typography>
            </Breadcrumbs>

            <CustomFieldGroupForm onSubmit={onSubmit} loading={isLoading} />
        </Container>
    );
};

export { CustomFieldGroupCreate };
