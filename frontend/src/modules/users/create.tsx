import { Breadcrumbs, Stack, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { CreateUserT } from "shared/model/types";
import { useAppSelector, userApi } from "shared/model";
import { Link, NotFound } from "shared/ui";
import { toastApiError } from "shared/utils";
import { UserForm } from "./components/user_form";

const UserCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const isAdmin = useAppSelector((state) => state.profile.user?.is_admin);

    const [createUser, { isLoading }] = userApi.useCreateUserMutation();

    const onSubmit = (formData: CreateUserT) => {
        createUser(formData)
            .unwrap()
            .then((response) => {
                navigate({
                    to: "/users/$userId",
                    params: { userId: response.payload.id },
                });
                toast.success(t("users.create.success"));
            })
            .catch(toastApiError);
    };

    if (!isAdmin) {
        return <NotFound />;
    }

    return (
        <Stack px={4} pb={4} gap={2}>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link to="/users" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("users.title")}
                    </Typography>
                </Link>
                <Typography fontSize={24} fontWeight="bold">
                    {t("users.create.title")}
                </Typography>
            </Breadcrumbs>

            <UserForm onSubmit={onSubmit} loading={isLoading} />
        </Stack>
    );
};

export { UserCreate };
