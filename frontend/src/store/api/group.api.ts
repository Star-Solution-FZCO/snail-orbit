import { createApi } from "@reduxjs/toolkit/query/react";
import {
    ApiResponse,
    CreateGroupT,
    GroupMemberT,
    GroupT,
    ListResponse,
    UpdateGroupT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["Groups"];

export const groupApi = createApi({
    reducerPath: "groupApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listGroup: build.query<ListResponse<GroupT>, void>({
            query: () => "group/list",
            providesTags: (result) => {
                let tags = [{ type: "Groups", id: "LIST" }];
                if (result) {
                    tags = tags.concat(
                        result.payload.items.map((group) => ({
                            type: "Groups",
                            id: group.id,
                        })),
                    );
                }
                return tags;
            },
        }),
        getGroup: build.query<ApiResponse<GroupT>, string>({
            query: (id) => `group/${id}`,
            providesTags: (_result, _error, id) => [{ type: "Groups", id }],
        }),
        createGroup: build.mutation<ApiResponse<GroupT>, CreateGroupT>({
            query: (body) => ({
                url: "group",
                method: "POST",
                body,
            }),
            invalidatesTags: [
                {
                    type: "Groups",
                    id: "LIST",
                },
            ],
        }),
        updateGroup: build.mutation<
            ApiResponse<GroupT>,
            { id: string } & UpdateGroupT
        >({
            query: ({ id, ...body }) => ({
                url: `group/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Groups", id },
            ],
        }),
        deleteGroup: build.mutation<ApiResponse<GroupT>, string>({
            query: (id) => ({
                url: `group/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [{ type: "Groups", id }],
        }),
        listGroupMembers: build.query<ListResponse<GroupMemberT>, string>({
            query: (id) => `group/${id}/members`,
            providesTags: (_result, _error, id) => [{ type: "Groups", id }],
        }),
        addGroupMember: build.mutation<
            ApiResponse<{ id: string }>,
            {
                id: string;
                userId: string;
            }
        >({
            query: ({ id, userId }) => ({
                url: `group/${id}/members/${userId}`,
                method: "POST",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Groups", id },
            ],
        }),
        removeGroupMember: build.mutation<
            ApiResponse<{ id: string }>,
            {
                id: string;
                userId: string;
            }
        >({
            query: ({ id, userId }) => ({
                url: `group/${id}/members/${userId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Groups", id },
            ],
        }),
    }),
});
