import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { groupApi } from "shared/model";
import type { GroupT, UpdateGroupT } from "shared/model/types";
import { toastApiError } from "shared/utils";
import { GroupForm } from "./group_form";

interface IGroupSettingsProps {
    group: GroupT;
}

const GroupSettings: FC<IGroupSettingsProps> = ({ group }) => {
    const { t } = useTranslation();

    const [updateGroup, { isLoading }] = groupApi.useUpdateGroupMutation();

    const onSubmit = (formData: UpdateGroupT) => {
        updateGroup({
            id: group.id,
            ...formData,
        })
            .unwrap()
            .then(() => {
                toast.success(t("groups.update.success"));
            })
            .catch(toastApiError);
    };

    return (
        <GroupForm
            defaultValues={group}
            onSubmit={onSubmit}
            loading={isLoading}
            hideCancel
        />
    );
};

export { GroupSettings };
