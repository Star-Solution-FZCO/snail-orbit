import { createApi } from "@reduxjs/toolkit/query/react";
import {
    ApiResponse,
    CreateUserT,
    ListResponse,
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
            providesTags: (_result, _error) => [
                { type: "Users", id: "PROFILE" },
            ],
        }),
        listUser: build.query<ListResponse<UserT>, void>({
            query: () => "user/list",
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
            ],
        }),
    }),
});
