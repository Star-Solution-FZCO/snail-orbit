import { createApi } from "@reduxjs/toolkit/query/react";
import {
    ApiResponse,
    CreateRoleT,
    ListQueryParams,
    ListResponse,
    PermissionKeyT,
    RoleT,
    UpdateRoleT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["Roles"];

export const roleApi = createApi({
    reducerPath: "roleApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listRole: build.query<ListResponse<RoleT>, ListQueryParams | void>({
            query: (params) => ({
                url: "role/list",
                params: params ?? undefined,
            }),
            providesTags: (result) => {
                let tags = [{ type: "Roles", id: "LIST" }];
                if (result) {
                    tags = tags.concat(
                        result.payload.items.map((role) => ({
                            type: "Roles",
                            id: role.id,
                        })),
                    );
                }
                return tags;
            },
        }),
        getRole: build.query<ApiResponse<RoleT>, string>({
            query: (id) => `role/${id}`,
            providesTags: (_result, _error, id) => [{ type: "Roles", id }],
        }),
        createRole: build.mutation<ApiResponse<RoleT>, CreateRoleT>({
            query: (body) => ({
                url: "role",
                method: "POST",
                body,
            }),
            invalidatesTags: [
                {
                    type: "Roles",
                    id: "LIST",
                },
            ],
        }),
        updateRole: build.mutation<
            ApiResponse<RoleT>,
            { id: string } & UpdateRoleT
        >({
            query: ({ id, ...body }) => ({
                url: `role/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Roles", id },
            ],
        }),
        deleteRole: build.mutation<ApiResponse<RoleT>, string>({
            query: (id) => ({
                url: `role/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [{ type: "Roles", id }],
        }),
        grantPermission: build.mutation<
            ApiResponse<RoleT>,
            {
                id: string;
                permissionKey: PermissionKeyT;
            }
        >({
            query: ({ id, permissionKey }) => ({
                url: `role/${id}/permission/${permissionKey}`,
                method: "POST",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Roles", id },
            ],
        }),
        revokePermission: build.mutation<
            ApiResponse<RoleT>,
            {
                id: string;
                permissionKey: PermissionKeyT;
            }
        >({
            query: ({ id, permissionKey }) => ({
                url: `role/${id}/permission/${permissionKey}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Roles", id },
            ],
        }),
    }),
});
