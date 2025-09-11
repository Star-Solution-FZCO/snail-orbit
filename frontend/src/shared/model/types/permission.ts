import {
    permissionTargetTypeValues,
    permissionTypeValues,
    type PermissionTargetType,
    type PermissionType,
    type PmApiViewsPermissionPermissionOutput,
} from "./backend-schema.gen";

export const permissionTargets = permissionTargetTypeValues;

export type PermissionTargetTypeT = PermissionTargetType;

export const permissionTypes = permissionTypeValues;

export type PermissionTypeT = PermissionType;

export type PermissionT = PmApiViewsPermissionPermissionOutput;

export type PermissionTargetT = PermissionT["target"];
