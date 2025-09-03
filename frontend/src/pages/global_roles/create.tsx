import { Breadcrumbs, Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { GlobalRoleForm } from "modules/global_roles/components/global_role_form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { roleApi } from "shared/model";
import type { CreateGlobalRoleT } from "shared/model/types";
import { Link } from "shared/ui";
import { toastApiError } from "shared/utils";

const GlobalRoleCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [createGlobalRole, { isLoading }] =
        roleApi.useCreateGlobalRoleMutation();

    const handleSubmit = (data: CreateGlobalRoleT) => {
        createGlobalRole(data)
            .unwrap()
            .then((response) => {
                navigate({
                    to: "/global-roles/$globalRoleId",
                    params: { globalRoleId: response.payload.id },
                });
                toast.success(t("globalRoles.create.success"));
            })
            .catch(toastApiError);
    };

    return (
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link to="/global-roles" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("globalRoles.title")}
                    </Typography>
                </Link>
                <Typography fontSize={24} fontWeight="bold">
                    {t("globalRoles.create.title")}
                </Typography>
            </Breadcrumbs>

            <GlobalRoleForm onSubmit={handleSubmit} loading={isLoading} />
        </Container>
    );
};

export { GlobalRoleCreate };
