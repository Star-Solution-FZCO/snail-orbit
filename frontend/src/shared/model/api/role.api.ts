import { createApi } from "@reduxjs/toolkit/query/react";
import {
    ApiResponse,
    CreateGlobalRoleT,
    CreateRoleT,
    GlobalPermissionKeyT,
    GlobalRoleSimpleT,
    GlobalRoleT,
    ListQueryParams,
    ListResponse,
    ListSelectQueryParams,
    PermissionKeyT,
    RoleT,
    UpdateGlobalRoleT,
    UpdateRoleT,
} from "shared/model/types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["Roles", "GlobalRoles"];

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
        // global roles
        listGlobalRole: build.query<
            ListResponse<GlobalRoleT>,
            ListQueryParams | void
        >({
            query: (params) => ({
                url: "global-role/list",
                params: params ?? undefined,
            }),
            providesTags: (result) => {
                let tags = [{ type: "GlobalRoles", id: "LIST" }];
                if (result) {
                    tags = tags.concat(
                        result.payload.items.map((role) => ({
                            type: "GlobalRoles",
                            id: role.id,
                        })),
                    );
                }
                return tags;
            },
        }),
        listSelectGlobalRole: build.query<
            ListResponse<GlobalRoleSimpleT> & { searchQuery?: string | null },
            ListSelectQueryParams | void
        >({
            query: (params) => ({
                url: "global-role/select",
                params: params ?? undefined,
            }),
            serializeQueryArgs: ({ endpointName }) => endpointName,
            merge: (currentCache, newItems, meta) => {
                if (meta.arg?.search !== currentCache?.searchQuery) {
                    currentCache.payload.items = [];
                }
                currentCache.payload.items.push(...newItems.payload.items);
                currentCache.payload.offset = newItems.payload.offset;
                currentCache.payload.count = newItems.payload.count;
                currentCache.searchQuery = meta.arg?.search;
            },
            forceRefetch: ({ currentArg, previousArg }) => {
                return (
                    currentArg?.offset !== previousArg?.offset ||
                    currentArg?.search !== previousArg?.search
                );
            },
            providesTags: () => [{ type: "GlobalRoles", id: "LIST" }],
        }),
        getGlobalRole: build.query<ApiResponse<GlobalRoleT>, string>({
            query: (id) => `global-role/${id}`,
            providesTags: (_result, _error, id) => [
                { type: "GlobalRoles", id },
            ],
        }),
        createGlobalRole: build.mutation<
            ApiResponse<GlobalRoleT>,
            CreateGlobalRoleT
        >({
            query: (body) => ({
                url: "global-role",
                method: "POST",
                body,
            }),
            invalidatesTags: [
                {
                    type: "GlobalRoles",
                    id: "LIST",
                },
            ],
        }),
        updateGlobalRole: build.mutation<
            ApiResponse<GlobalRoleT>,
            { id: string } & UpdateGlobalRoleT
        >({
            query: ({ id, ...body }) => ({
                url: `global-role/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "GlobalRoles", id },
            ],
        }),
        deleteGlobalRole: build.mutation<ApiResponse<GlobalRoleT>, string>({
            query: (id) => ({
                url: `global-role/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "GlobalRoles", id },
            ],
        }),
        grantGlobalPermission: build.mutation<
            ApiResponse<GlobalRoleT>,
            {
                id: string;
                permissionKey: GlobalPermissionKeyT;
            }
        >({
            query: ({ id, permissionKey }) => ({
                url: `global-role/${id}/permission/${permissionKey}`,
                method: "POST",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "GlobalRoles", id },
            ],
        }),
        revokeGlobalPermission: build.mutation<
            ApiResponse<GlobalRoleT>,
            {
                id: string;
                permissionKey: GlobalPermissionKeyT;
            }
        >({
            query: ({ id, permissionKey }) => ({
                url: `global-role/${id}/permission/${permissionKey}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "GlobalRoles", id },
            ],
        }),
    }),
});
