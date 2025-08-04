import { createApi } from "@reduxjs/toolkit/query/react";
import {
    ApiResponse,
    CreateGlobalRoleT,
    GlobalPermissionKeyT,
    GlobalRoleSimpleT,
    GlobalRoleT,
    ListQueryParams,
    ListResponse,
    ListSelectQueryParams,
    UpdateGlobalRoleT,
} from "shared/model/types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["GlobalRoles"];

export const globalRoleApi = createApi({
    reducerPath: "globalRoleApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
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
