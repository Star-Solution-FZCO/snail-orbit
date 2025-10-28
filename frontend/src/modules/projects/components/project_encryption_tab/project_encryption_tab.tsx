import { Stack } from "@mui/material";
import type { FC } from "react";
import { useCallback } from "react";
import { projectApi } from "shared/model";
import type { BasicUserT, ProjectT } from "shared/model/types";
import { MainInfo } from "./main_info";
import { UsersTable } from "./users_table";

type ProjectEncryptionTabProps = {
    project: ProjectT;
};

export const ProjectEncryptionTab: FC<ProjectEncryptionTabProps> = (props) => {
    const { project } = props;
    const [updateProject] = projectApi.useUpdateProjectMutation();

    const handleAddUser = useCallback(
        (user: BasicUserT) => {
            if (!project.encryption_settings) return;
            updateProject({
                id: project.slug,
                encryption_settings: {
                    users: [
                        ...project.encryption_settings.users.map((el) => el.id),
                        user.id,
                    ],
                },
            });
        },
        [updateProject, project],
    );

    const handleRemoveUser = useCallback(
        (user: BasicUserT) => {
            if (!project.encryption_settings) return;
            updateProject({
                id: project.slug,
                encryption_settings: {
                    users: project.encryption_settings.users
                        .map((el) => el.id)
                        .filter((el) => el !== user.id),
                },
            });
        },
        [updateProject, project],
    );

    if (!project.encryption_settings) return null;

    const encryption_settings = project.encryption_settings;

    return (
        <Stack direction="column" gap={2}>
            <MainInfo encryptionSettings={encryption_settings} />
            <UsersTable
                encryptionSettings={encryption_settings}
                onUserAdded={handleAddUser}
                onUserRemoved={handleRemoveUser}
            />
        </Stack>
    );
};
