import { Breadcrumbs, Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { Link, NotFound } from "components";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi, useAppSelector } from "store";
import { CreateCustomFieldGroupT } from "types";
import { toastApiError } from "utils";
import { CustomFieldGroupForm } from "./components/custom_field_group_form";

const CustomFieldGroupCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const isAdmin = useAppSelector((state) => state.profile.user?.is_admin);

    const [createCustomFieldGroup, { isLoading }] =
        customFieldsApi.useCreateCustomFieldGroupMutation();

    const onSubmit = (formData: CreateCustomFieldGroupT) => {
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
