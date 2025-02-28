import type { PermissionT } from "./permission";
import type { BasicUserT } from "./user";

export type CreateSearchT = Pick<
    SearchT,
    "name" | "query" | "description" | "id"
>;

export type SearchT = {
    id: string;
    name: string;
    query: string;
    description: string;
    create_by: BasicUserT;
    permissions: PermissionT[];
};
