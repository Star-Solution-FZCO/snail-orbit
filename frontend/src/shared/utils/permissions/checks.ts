import type { PermissionTypeT } from "shared/model/types";

export const canOnlyView = (permission?: PermissionTypeT) =>
    permission === "view";

export const canView = (permission?: PermissionTypeT) =>
    permission === "view" || permission === "edit" || permission === "admin";

export const canEdit = (permission?: PermissionTypeT) =>
    permission === "edit" || permission === "admin";

export const isAdmin = (permission?: PermissionTypeT) => permission === "admin";
