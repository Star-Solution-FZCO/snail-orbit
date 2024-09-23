import {
    BasicUserT,
    GroupT,
    ProjectPermissionTargetT,
    TargetTypeT,
} from "types";

export const tabs = [
    {
        label: "projects.sections.generalInfo",
        value: "general",
    },
    {
        label: "projects.sections.access",
        value: "access",
    },
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
    users: BasicUserT[],
    groups: GroupT[],
): Array<ProjectPermissionTargetT & { type: TargetTypeT; avatar?: string }> => {
    const merged = [
        ...users.map((user) => ({
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            type: "user" as TargetTypeT,
        })),
        ...groups.map((group) => ({
            id: group.id,
            name: group.name,
            type: "group" as TargetTypeT,
        })),
    ];

    return merged.filter(
        (value, index, self) =>
            self.findIndex((v) => v.id === value.id) === index,
    );
};

export const generateSlug = (name: string): string => {
    if (!name) return "";

    const words = name.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
        return words[0].toUpperCase();
    }

    let slug = "";

    for (let word of words) {
        const capitals = word.match(/[A-Z0-9]/g);

        if (capitals) {
            slug += capitals.join("");
        } else {
            slug += word[0].toUpperCase();
        }
    }

    return slug;
};
