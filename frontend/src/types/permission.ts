import type { GroupT } from "./group";
import type { BasicUserT } from "./user";

export const permissionTargets = ["group", "user"] as const;

export type PermissionTargetT = (typeof permissionTargets)[number];

export const permissionTypes = ["view", "edit", "admin"] as const;

export type PermissionTypeT = (typeof permissionTypes)[number];

export type PermissionT = {
    id: string;
    target_type: PermissionTargetT;
    permission_type: PermissionTypeT;
    target: BasicUserT | GroupT;
};
