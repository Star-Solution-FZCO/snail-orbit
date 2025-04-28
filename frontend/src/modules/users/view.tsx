import { Breadcrumbs, Stack, Typography } from "@mui/material";
import { getRouteApi } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { UpdateUserT } from "shared/model/types";
import { userApi } from "shared/model";
import { ErrorHandler, Link } from "shared/ui";
import { toastApiError } from "shared/utils";
import { UserForm } from "./components/user_form";

const routeApi = getRouteApi("/_authenticated/users/$userId");

const UserView = () => {
    const { t } = useTranslation();
    const { userId } = routeApi.useParams();

    const { data, error } = userApi.useGetUserQuery(userId);

    const [updateUser, { isLoading: updateLoading }] =
        userApi.useUpdateUserMutation();

    const onSubmit = (formData: UpdateUserT) => {
        const user = data?.payload;
        if (!user) return;

        updateUser({
            id: user.id,
            ...formData,
        })
            .unwrap()
            .then(() => {
                toast.success(t("users.update.success"));
            })
            .catch(toastApiError);
    };

    if (error) {
        return <ErrorHandler error={error} message="users.item.fetch.error" />;
    }

    if (!data) return null;

    const user = data.payload;

    return (
        <Stack px={4} pb={4} gap={2}>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link to="/users" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("users.title")}
                    </Typography>
                </Link>
                <Typography fontSize={24} fontWeight="bold">
                    {user.name}
                </Typography>
            </Breadcrumbs>

            <UserForm
                defaultValues={user}
                onSubmit={onSubmit}
                loading={updateLoading}
            />
        </Stack>
    );
};

export { UserView };
