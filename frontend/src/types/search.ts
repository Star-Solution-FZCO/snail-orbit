import type {
    PermissionT,
    PermissionTargetT,
    PermissionTypeT,
} from "./permission";
import type { BasicUserT } from "./user";

export type SearchFormValuesT = Pick<
    SearchT,
    "name" | "query" | "description" | "id" | "permissions"
>;

type CreatePermissionT = {
    target_type: PermissionTargetT;
    permission_type: PermissionTypeT;
    target: string;
};

export type UpdateSearchT = Partial<Omit<SearchFormValuesT, "permissions">> & {
    permissions?: CreatePermissionT[];
};

export type CreateSearchT = UpdateSearchT &
    Required<Pick<UpdateSearchT, "name" | "query">>;

export type SearchT = {
    id: string;
    name: string;
    query: string;
    description: string;
    create_by: BasicUserT;
    permissions: PermissionT[];
};
