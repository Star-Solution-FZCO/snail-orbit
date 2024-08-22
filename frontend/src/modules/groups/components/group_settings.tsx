import { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { groupApi } from "store";
import { GroupT, UpdateGroupT } from "types";
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
            .catch((error) => {
                toast.error(error.data.detail || t("error.default"));
            });
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
