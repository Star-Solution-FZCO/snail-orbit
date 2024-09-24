import { Breadcrumbs, Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { Link, NotFound } from "components";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { roleApi, useAppSelector } from "store";
import { CreateRoleT } from "types";
import { toastApiError } from "utils";
import { RoleForm } from "./components/role_form";

const RoleCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const isAdmin = useAppSelector((state) => state.profile.user?.is_admin);

    const [createRole, { isLoading }] = roleApi.useCreateRoleMutation();

    const onSubmit = (formData: CreateRoleT) => {
        createRole(formData)
            .unwrap()
            .then((response) => {
                navigate({
                    to: "/roles/$roleId",
                    params: { roleId: response.payload.id },
                });
                toast.success(t("roles.create.success"));
            })
            .catch(toastApiError);
    };

    if (!isAdmin) {
        return <NotFound />;
    }

    return (
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link to="/roles" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("roles.title")}
                    </Typography>
                </Link>
                <Typography fontSize={24} fontWeight="bold">
                    {t("roles.create.title")}
                </Typography>
            </Breadcrumbs>

            <RoleForm onSubmit={onSubmit} loading={isLoading} />
        </Container>
    );
};

export { RoleCreate };
