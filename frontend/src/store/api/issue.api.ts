import { createApi } from "@reduxjs/toolkit/query/react";
import {
    ApiResponse,
    CommentT,
    CreateCommentT,
    CreateIssueT,
    IssueT,
    ListQueryParams,
    ListResponse,
    UpdateCommentT,
    UpdateIssueT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const coreTag = "Issues";

const tagTypes = [coreTag, "IssueComments"];

export const issueApi = createApi({
    reducerPath: "issuesApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listIssues: build.query<ListResponse<IssueT>, ListQueryParams | void>({
            query: (params) => ({
                url: "issue/list",
                params: params ?? undefined,
            }),
            providesTags: (result) => {
                let tags = [{ type: coreTag, id: "LIST" }];
                if (result) {
                    tags = tags.concat(
                        result.payload.items.map((issue) => ({
                            type: coreTag,
                            id: issue.id,
                        })),
                    );
                }
                return tags;
            },
        }),
        getIssues: build.query<ApiResponse<IssueT>, string>({
            query: (id) => `issue/${id}`,
            providesTags: (_result, _error, id) => [{ type: coreTag, id }],
        }),
        createIssues: build.mutation<ApiResponse<IssueT>, CreateIssueT>({
            query: (body) => ({ url: "issue/", method: "POST", body }),
            invalidatesTags: [{ type: coreTag, id: "LIST" }],
        }),
        updateIssues: build.mutation<
            ApiResponse<IssueT>,
            { id: string } & UpdateIssueT
        >({
            query: ({ id, ...body }) => ({
                url: `issue/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: coreTag, id },
            ],
        }),
        deleteIssue: build.mutation<ApiResponse<{ id: string }>, string>({
            query: (id) => ({
                url: `issue/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [{ type: "Issues", id }],
        }),
        listIssueComments: build.query<
            ListResponse<CommentT>,
            { id: string; params?: ListQueryParams }
        >({
            query: ({ id, params }) => ({
                url: `issue/${id}/comment/list`,
                params,
            }),
            providesTags: (result) => {
                let tags = [{ type: "IssueComments", id: "LIST" }];
                if (result) {
                    tags = tags.concat(
                        result.payload.items.map((comment) => ({
                            type: "IssueComments",
                            id: comment.id,
                        })),
                    );
                }
                return tags;
            },
        }),
        getIssueComment: build.query<
            ApiResponse<CommentT>,
            { id: string; commentId: string }
        >({
            query: ({ id, commentId }) => `issue/${id}/comment/${commentId}`,
            providesTags: (_result, _error, { commentId }) => [
                { type: "IssueComments", id: commentId },
            ],
        }),
        createIssueComment: build.mutation<
            ApiResponse<CommentT>,
            { id: string } & CreateCommentT
        >({
            query: ({ id, ...body }) => ({
                url: `issue/${id}/comment/`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error) => [
                { type: "IssueComments", id: "LIST" },
            ],
        }),
        updateIssueComment: build.mutation<
            ApiResponse<CommentT>,
            { id: string; commentId: string } & UpdateCommentT
        >({
            query: ({ id, commentId, ...body }) => ({
                url: `issue/${id}/comment/${commentId}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { commentId }) => [
                { type: "IssueComments", id: commentId },
            ],
        }),
        deleteIssueComment: build.mutation<
            ApiResponse<{ id: string }>,
            { id: string; commentId: string }
        >({
            query: ({ id, commentId }) => ({
                url: `issue/${id}/comment/${commentId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { commentId }) => [
                { type: "IssueComments", id: commentId },
            ],
        }),
    }),
});
