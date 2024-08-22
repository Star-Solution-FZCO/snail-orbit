import { Box, Breadcrumbs, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "components";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { roleApi } from "store";
import { CreateRoleT } from "types";
import { RoleForm } from "./components/role_form";

const RoleCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

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
            .catch((error) => {
                toast.error(error.data.detail || t("error.default"));
            });
    };

    return (
        <Box display="flex" flexDirection="column" px={4} gap={2}>
            <Breadcrumbs>
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
        </Box>
    );
};

export { RoleCreate };
