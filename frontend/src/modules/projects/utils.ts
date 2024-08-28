import { GroupT, ProjectPermissionTargetT, TargetTypeT, UserT } from "types";

export const tabs = [
    {
        label: "projects.sections.generalInfo",
        value: "general",
    },
    {
        label: "projects.sections.access",
        value: "access",
    },
    // {
    //     label: "projects.sections.members",
    //     value: "members",
    // },
    {
        label: "projects.sections.customFields",
        value: "custom-fields",
    },
    {
        label: "projects.sections.workflows",
        value: "workflows",
    },
];

export const mergeUsersAndGroups = (
    users: UserT[],
    groups: GroupT[],
): Array<ProjectPermissionTargetT & { type: TargetTypeT }> => {
    return [
        ...users.map((user) => ({
            id: user.id,
            name: user.name,
            type: "user" as TargetTypeT,
        })),
        ...groups.map((group) => ({
            id: group.id,
            name: group.name,
            type: "group" as TargetTypeT,
        })),
    ];
};
