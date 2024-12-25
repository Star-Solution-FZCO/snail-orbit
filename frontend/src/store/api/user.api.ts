import { createApi } from "@reduxjs/toolkit/query/react";
import {
    ApiResponse,
    APITokenT,
    BasicUserT,
    CreateUserT,
    ListQueryParams,
    ListResponse,
    ListSelectQueryParams,
    NewApiTokenT,
    UpdateUserT,
    UserT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["Users"];

export const userApi = createApi({
    reducerPath: "userApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        getProfile: build.query<ApiResponse<UserT>, void>({
            query: () => "profile",
            providesTags: (result, _error) => [
                { type: "Users", id: result?.payload.id },
            ],
        }),
        listUser: build.query<ListResponse<UserT>, ListQueryParams | void>({
            query: (params) => ({
                url: "user/list",
                params: params ?? undefined,
            }),
            providesTags: (_result, _error) => [{ type: "Users", id: "LIST" }],
        }),
        listSelectUser: build.query<
            ListResponse<BasicUserT>,
            ListSelectQueryParams | void
        >({
            query: (params) => ({
                url: "user/select",
                params: params ?? undefined,
            }),
            serializeQueryArgs: ({ endpointName }) => endpointName,
            merge: (currentCache, newItems) => {
                currentCache.payload.items.push(...newItems.payload.items);
                currentCache.payload.offset = newItems.payload.offset;
                currentCache.payload.count = newItems.payload.count;
            },
            forceRefetch: ({ currentArg, previousArg }) => {
                return currentArg?.offset !== previousArg?.offset;
            },
            providesTags: (_result, _error) => [{ type: "Users", id: "LIST" }],
        }),
        getUser: build.query<ApiResponse<UserT>, string>({
            query: (id) => `user/${id}`,
            providesTags: (_result, _error, id) => [{ type: "Users", id }],
        }),
        createUser: build.mutation<ApiResponse<UserT>, CreateUserT>({
            query: (body) => ({
                url: "user",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Users", id: "LIST" }],
        }),
        updateUser: build.mutation<
            ApiResponse<UserT>,
            { id: string } & UpdateUserT
        >({
            query: ({ id, ...body }) => ({
                url: `user/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Users", id },
                { type: "Users", id: "LIST" },
            ],
        }),
        createAPIToken: build.mutation<
            ApiResponse<NewApiTokenT>,
            { name: string; expires_at: string | null }
        >({
            query: (body) => ({
                url: `settings/api_token`,
                method: "POST",
                body,
            }),
            invalidatesTags: () => [{ type: "APITokens", id: "LIST" }],
        }),
        listAPIToken: build.query<
            ListResponse<APITokenT>,
            ListQueryParams | void
        >({
            query: (params) => ({
                url: "settings/api_token/list",
                params: params ?? undefined,
            }),
            providesTags: () => [{ type: "APITokens", id: "LIST" }],
        }),
    }),
});
