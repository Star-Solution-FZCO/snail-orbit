import { Box, Breadcrumbs, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { globalRoleApi } from "shared/model";
import type { CreateGlobalRoleT } from "shared/model/types";
import { Link } from "shared/ui";
import { toastApiError } from "shared/utils";
import { GlobalRoleForm } from "./components/global_role_form";

const GlobalRoleCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [createGlobalRole, { isLoading }] =
        globalRoleApi.useCreateGlobalRoleMutation();

    const handleSubmit = async (data: CreateGlobalRoleT) => {
        try {
            const result = await createGlobalRole(data).unwrap();
            navigate({
                to: "/global-roles/$globalRoleId",
                params: { globalRoleId: result.payload.id },
            });
        } catch (error) {
            toastApiError(error);
        }
    };

    return (
        <Box display="flex" flexDirection="column" px={4} pb={4} gap={2}>
            <Breadcrumbs>
                <Link to="/global-roles" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("global-roles.title")}
                    </Typography>
                </Link>
                <Typography fontSize={24} fontWeight="bold">
                    {t("global-roles.create.title")}
                </Typography>
            </Breadcrumbs>

            <GlobalRoleForm
                onSubmit={handleSubmit}
                isSubmitting={isLoading}
                submitText={t("global-roles.create.submit")}
            />
        </Box>
    );
};

export { GlobalRoleCreate };
