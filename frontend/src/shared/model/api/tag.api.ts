import { createApi } from "@reduxjs/toolkit/query/react";
import type {
    ListQueryParams,
    ListResponse,
    PermissionT,
    PermissionTargetT,
    PermissionTypeT,
    TagDto,
    TagT,
} from "shared/model/types";
import { type ApiResponse } from "shared/model/types";
import customFetchBase from "./custom_fetch_base";
import { issueApi } from "./issue.api";

const tagTypes = ["Tags"];

export const tagApi = createApi({
    reducerPath: "tagApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listTags: build.query<ListResponse<TagT>, ListQueryParams | void>({
            query: (params) => ({
                url: "tag/list",
                params: params ?? undefined,
            }),
            providesTags: (result) => {
                let tags = [{ type: "Tags", id: "LIST" }];
                if (result) {
                    tags = tags.concat(
                        result.payload.items.map((tag) => ({
                            type: "Tags",
                            id: tag.id,
                        })),
                    );
                }
                return tags;
            },
        }),
        getTag: build.query<ApiResponse<TagT>, string>({
            query: (id) => ({ url: `tag/${id}` }),
            providesTags: (_result, _error, id) => [{ type: "Tags", id }],
        }),
        createTag: build.mutation<ApiResponse<TagT>, TagDto>({
            query: (body) => ({ url: "tag/", method: "POST", body }),
            invalidatesTags: [{ type: "Tags", id: "LIST" }],
        }),
        updateTag: build.mutation<ApiResponse<TagT>, TagDto & Pick<TagT, "id">>(
            {
                query: ({ id, ...body }) => ({
                    url: `tag/${id}`,
                    method: "PUT",
                    body,
                }),
                invalidatesTags: [{ type: "Tags", id: "LIST" }],
                async onQueryStarted(_, { dispatch, queryFulfilled }) {
                    await queryFulfilled;
                    dispatch(issueApi.util.invalidateTags(["Issues"]));
                },
            },
        ),
        deleteTag: build.mutation<ApiResponse<{ id: string }>, string>({
            query: (id) => ({ url: `tag/${id}`, method: "DELETE" }),
            invalidatesTags: [{ type: "Tags", id: "LIST" }],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                await queryFulfilled;
                dispatch(issueApi.util.invalidateTags(["Issues"]));
            },
        }),
        getTagPermissions: build.query<
            ListResponse<PermissionT>,
            { tagId: string } & ListQueryParams
        >({
            query: ({ tagId, ...params }) => ({
                url: `tag/${tagId}/permissions`,
                params,
            }),
            providesTags: (_result, _error, { tagId }) => [
                { type: "Tags", id: tagId },
            ],
        }),
        grantTagPermission: build.mutation<
            ApiResponse<{ id: string }>,
            {
                tagId: string;
                target_type: PermissionTargetT;
                target: string;
                permission_type: PermissionTypeT;
            }
        >({
            query: ({ tagId, ...body }) => ({
                url: `tag/${tagId}/permission`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, { tagId }) => [
                { type: "Tags", id: tagId },
            ],
        }),
        updateTagPermission: build.mutation<
            ApiResponse<{ id: string }>,
            {
                tagId: string;
                permissionId: string;
                permission_type: PermissionTypeT;
            }
        >({
            query: ({ tagId, permissionId, permission_type }) => ({
                url: `tag/${tagId}/permission/${permissionId}`,
                method: "PUT",
                body: { permission_type },
            }),
            invalidatesTags: (_result, _error, { tagId }) => [
                { type: "Tags", id: tagId },
            ],
        }),
        revokeTagPermission: build.mutation<
            ApiResponse<{ id: string }>,
            { tagId: string; permissionId: string }
        >({
            query: ({ tagId, permissionId }) => ({
                url: `tag/${tagId}/permission/${permissionId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_, __, { tagId }) => [
                { type: "Tags", id: tagId },
            ],
        }),
    }),
});
