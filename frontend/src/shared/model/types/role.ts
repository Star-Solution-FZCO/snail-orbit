export type CreateRoleT = {
    name: string;
    description: string | null;
};

export type UpdateRoleT = Partial<CreateRoleT>;

export const permissionKeys = [
    "project:read",
    "project:update",
    "project:delete",
    "issue:create",
    "issue:read",
    "issue:update",
    "issue:delete",
    "comment:create",
    "comment:read",
    "comment:update",
    "comment:delete_own",
    "comment:delete",
    "attachment:create",
    "attachment:read",
    "attachment:delete_own",
    "attachment:delete",
] as const;

export type PermissionKeyT = (typeof permissionKeys)[number];

export type RolePermissionT = {
    key: PermissionKeyT;
    label: string;
    granted: boolean;
};

export type PermissionGroupT = {
    label: string;
    permissions: RolePermissionT[];
};

export type RoleT = {
    id: string;
    name: string;
    description: string;
    permissions: PermissionGroupT[];
};
