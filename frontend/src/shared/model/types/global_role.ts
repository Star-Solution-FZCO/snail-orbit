export type CreateGlobalRoleT = {
    name: string;
    description: string | null;
};

export type UpdateGlobalRoleT = Partial<CreateGlobalRoleT>;

export const globalPermissionKeys = ["global:project_create"] as const;

export type GlobalPermissionKeyT = (typeof globalPermissionKeys)[number];

export type GlobalRolePermissionT = {
    key: GlobalPermissionKeyT;
    label: string;
    granted: boolean;
};

export type GlobalPermissionGroupT = {
    label: string;
    permissions: GlobalRolePermissionT[];
};

export type GlobalRoleT = {
    id: string;
    name: string;
    description: string;
    permissions: GlobalPermissionGroupT[];
};

export type GlobalRoleSimpleT = {
    id: string;
    name: string;
    description: string | null;
};
