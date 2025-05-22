import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { roleApi } from "shared/model";
import type { RoleT, UpdateGroupT } from "shared/model/types";
import { toastApiError } from "shared/utils";
import { RoleForm } from "./role_form";

interface IRoleSettingsProps {
    role: RoleT;
}

const RoleSettings: FC<IRoleSettingsProps> = ({ role }) => {
    const { t } = useTranslation();

    const [updateRole, { isLoading }] = roleApi.useUpdateRoleMutation();

    const onSubmit = (formData: UpdateGroupT) => {
        updateRole({
            id: role.id,
            ...formData,
        })
            .unwrap()
            .then(() => {
                toast.success(t("roles.update.success"));
            })
            .catch(toastApiError);
    };

    return (
        <RoleForm
            defaultValues={role}
            onSubmit={onSubmit}
            loading={isLoading}
            hideCancel
        />
    );
};

export { RoleSettings };
