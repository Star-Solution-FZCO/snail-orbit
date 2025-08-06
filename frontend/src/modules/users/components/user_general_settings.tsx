import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { userApi } from "shared/model";
import type { UpdateUserT, UserT } from "shared/model/types";
import { toastApiError } from "shared/utils";
import { UserForm } from "./user_form";

interface IUserGeneralSettingsProps {
    user: UserT;
}

const UserGeneralSettings: FC<IUserGeneralSettingsProps> = ({ user }) => {
    const { t } = useTranslation();

    const [updateUser, { isLoading }] = userApi.useUpdateUserMutation();

    const onSubmit = (formData: UpdateUserT) => {
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

    return (
        <UserForm
            defaultValues={user}
            onSubmit={onSubmit}
            loading={isLoading}
            hideCancel
        />
    );
};

export { UserGeneralSettings as UserSettings };
