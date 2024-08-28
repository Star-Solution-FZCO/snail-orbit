import { Breadcrumbs, Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "components";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi } from "store";
import { CreateCustomFieldT } from "types";
import { toastApiError } from "utils";
import { CustomFieldForm } from "./components/custom_field_form";

const CustomFieldCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [createCustomField, { isLoading }] =
        customFieldsApi.useCreateCustomFieldMutation();

    const onSubmit = (formData: CreateCustomFieldT) => {
        createCustomField(formData)
            .unwrap()
            .then(() => {
                navigate({
                    to: "/custom-fields",
                });
                toast.success(t("customFields.create.success"));
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
                    {t("customFields.create.title")}
                </Typography>
            </Breadcrumbs>

            <CustomFieldForm onSubmit={onSubmit} loading={isLoading} />
        </Container>
    );
};

export { CustomFieldCreate };
