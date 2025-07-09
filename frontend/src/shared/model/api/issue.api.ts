import { createApi } from "@reduxjs/toolkit/query/react";
import type {
    ApiResponse,
    CommentT,
    CustomFieldValueT,
    IssueDraftT,
    IssueFeedRecordT,
    IssueHistoryT,
    IssueLinkTypeT,
    IssueSpentTimeT,
    IssueT,
    IssueWithErrorsT,
    ListQueryParams,
    ListResponse,
    ListSelectQueryParams,
    TagT,
} from "shared/model/types";
import type {
    IssueCommentCreate,
    IssueCommentUpdate,
    IssueCreate,
    IssueDraftUpdate,
    IssueUpdate,
} from "../types/backend-schema.gen";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["Issues", "IssueComments", "IssueHistories", "IssueDrafts"];

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
                let tags = [{ type: "Issues", id: "LIST" }];
                if (result) {
                    tags = tags.concat(
                        result.payload.items.map((issue) => ({
                            type: "Issues",
                            id: issue.id,
                        })),
                    );
                }
                return tags;
            },
        }),
        getIssue: build.query<ApiResponse<IssueWithErrorsT>, string>({
            query: (id) => `issue/${id}`,
            providesTags: (_result, _error, id) => [{ type: "Issues", id }],
        }),
        createIssue: build.mutation<ApiResponse<IssueT>, IssueCreate>({
            query: (body) => ({ url: "issue/", method: "POST", body }),
            invalidatesTags: [{ type: "Issues", id: "LIST" }],
        }),
        updateIssue: build.mutation<
            ApiResponse<IssueT>,
            { id: string } & IssueUpdate
        >({
            query: ({ id, ...body }) => ({
                url: `issue/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Issues", id: "LIST" },
                { type: "IssueHistories", id },
            ],
            async onQueryStarted(
                { id },
                { dispatch, queryFulfilled },
            ): Promise<void> {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        issueApi.util.upsertQueryData("getIssue", id, data),
                    );
                } catch (e) {
                    // @ts-expect-error Fuck this TODO: fix
                    const data = e.error.data.payload as IssueT;
                    // @ts-expect-error Fuck this TODO: fix
                    const errorFields = e.error.data.error_fields as Record<
                        string,
                        string
                    >;
                    dispatch(
                        issueApi.util.upsertQueryData("getIssue", id, {
                            payload: {
                                ...data,
                                error_fields: errorFields,
                            },
                            success: false,
                        }),
                    );
                }
            },
        }),
        deleteIssue: build.mutation<ApiResponse<{ id: string }>, string>({
            query: (id) => ({
                url: `issue/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "Issues", id },
                { type: "Issues", id: "LIST" },
            ],
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
            { id: string } & IssueCommentCreate
        >({
            query: ({ id, ...body }) => ({
                url: `issue/${id}/comment/`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "IssueComments", id },
            ],
        }),
        updateIssueComment: build.mutation<
            ApiResponse<CommentT>,
            { id: string; commentId: string } & IssueCommentUpdate
        >({
            query: ({ id, commentId, ...body }) => ({
                url: `issue/${id}/comment/${commentId}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "IssueComments", id: id },
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
            invalidatesTags: (_result, _error, { id }) => [
                { type: "IssueComments", id: id },
            ],
        }),
        listIssueHistory: build.query<
            ListResponse<IssueHistoryT>,
            { id: string; params?: ListQueryParams }
        >({
            query: ({ id, params }) => ({
                url: `issue/${id}/history/list`,
                params,
            }),
            providesTags: (_result, _error, { id }) => [
                { type: "IssueHistories", id },
            ],
        }),
        createDraft: build.mutation<ApiResponse<IssueDraftT>, void>({
            query: () => ({ url: "issue/draft", method: "POST", body: {} }),
            invalidatesTags: () => [{ type: "IssueDrafts", id: "LIST" }],
        }),
        getDraft: build.query<ApiResponse<IssueDraftT>, string>({
            query: (id) => `issue/draft/${id}`,
            providesTags: (_result, _error, id) => [{ type: "Drafts", id }],
        }),
        updateDraft: build.mutation<
            ApiResponse<IssueDraftT>,
            { id: string } & IssueDraftUpdate
        >({
            query: ({ id, ...body }) => ({
                url: `issue/draft/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: () => [{ type: "IssueDrafts", id: "LIST" }],
            async onQueryStarted(
                { id },
                { dispatch, queryFulfilled },
            ): Promise<void> {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        issueApi.util.upsertQueryData("getDraft", id, data),
                    );
                } catch {
                    dispatch(
                        issueApi.util.invalidateTags([
                            { type: "IssueDrafts", id },
                        ]),
                    );
                }
            },
        }),
        createIssueFromDraft: build.mutation<ApiResponse<IssueT>, string>({
            query: (id) => ({
                url: `issue/draft/${id}/create`,
                method: "POST",
            }),
            invalidatesTags: () => [{ type: "Issues", id: "LIST" }],
        }),
        listSelectLinkableIssues: build.query<
            ListResponse<IssueT>,
            { id: string; params?: ListSelectQueryParams }
        >({
            query: ({ id, params }) => ({
                url: `issue/${id}/link/target/select`,
                params,
            }),
        }),
        linkIssue: build.mutation<
            ApiResponse<IssueT>,
            { id: string; target_issues: string[]; type: IssueLinkTypeT }
        >({
            query: ({ id, ...body }) => ({
                url: `issue/${id}/link`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Issues", id: "LIST" },
                { type: "Issues", id },
                { type: "IssueHistories", id },
            ],
        }),
        unlinkIssue: build.mutation<
            ApiResponse<IssueT>,
            { id: string; interlink_id: string }
        >({
            query: ({ id, interlink_id }) => ({
                url: `issue/${id}/link/${interlink_id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Issues", id: "LIST" },
                { type: "Issues", id },
                { type: "IssueHistories", id },
            ],
        }),
        updateIssueLink: build.mutation<
            ApiResponse<IssueT>,
            { id: string; interlink_id: string; type: IssueLinkTypeT }
        >({
            query: ({ id, interlink_id, ...body }) => ({
                url: `issue/${id}/link/${interlink_id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Issues", id },
            ],
        }),
        getIssueSpentTime: build.query<ApiResponse<IssueSpentTimeT>, string>({
            query: (id) => `issue/${id}/spent_time`,
            providesTags: (_result, _error, id) => [
                { type: "IssueComments", id },
                { type: "IssueHistories", id },
            ],
        }),
        filterBuildQueryString: build.query<
            ApiResponse<{ query: string }>,
            { filters: { field: string; value: CustomFieldValueT }[] }
        >({
            query: (body) => ({
                url: `issue/filters/build-query`,
                body,
                method: "POST",
            }),
        }),
        filterParseQueryString: build.query<
            ApiResponse<{
                filters: {
                    field: { id: string; name: string };
                    value: CustomFieldValueT;
                }[];
            }>,
            { query: string }
        >({
            query: (body) => ({
                url: `issue/filters/parse-query`,
                body,
                method: "POST",
            }),
        }),
        listIssueFeed: build.query<
            ListResponse<IssueFeedRecordT>,
            { id: string; params?: ListQueryParams }
        >({
            query: ({ id, params }) => ({
                url: `issue/${id}/feed/list`,
                params,
            }),
            providesTags: (_result, _error, { id }) => [
                { type: "IssueComments", id },
                { type: "IssueHistories", id },
            ],
        }),
        tagIssue: build.mutation<
            ApiResponse<IssueT>,
            { issueId: string; tag: TagT }
        >({
            query: ({ issueId, tag }) => ({
                url: `issue/${issueId}/tag`,
                method: "PUT",
                body: { tag_id: tag.id },
            }),
            invalidatesTags: (_result, _error, { issueId }) => [
                { type: "Issues", id: "LIST" },
                { type: "Issues", id: issueId },
            ],
            async onQueryStarted(
                { issueId, tag },
                { dispatch, queryFulfilled },
            ) {
                const patchResult = dispatch(
                    issueApi.util.updateQueryData(
                        "getIssue",
                        issueId,
                        (data) => {
                            data.payload.tags = [
                                ...data.payload.tags,
                                {
                                    id: tag.id,
                                    color: tag.color,
                                    name: tag.name,
                                },
                            ];
                        },
                    ),
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
        }),
        untagIssue: build.mutation<
            ApiResponse<IssueT>,
            { issueId: string; tagId: string }
        >({
            query: ({ issueId, tagId }) => ({
                url: `issue/${issueId}/untag`,
                method: "PUT",
                body: { tag_id: tagId },
            }),
            invalidatesTags: (_result, _error, { issueId }) => [
                { type: "Issues", id: "LIST" },
                { type: "Issues", issueId },
            ],
            async onQueryStarted(
                { issueId, tagId },
                { dispatch, queryFulfilled },
            ) {
                const patchResult = dispatch(
                    issueApi.util.updateQueryData(
                        "getIssue",
                        issueId,
                        (data) => {
                            data.payload.tags = data.payload.tags.filter(
                                (tag) => tag.id !== tagId,
                            );
                        },
                    ),
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
        }),
        subscribeIssue: build.mutation<ApiResponse<IssueT>, string>({
            query: (id) => ({
                url: `issue/${id}/subscribe`,
                method: "POST",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "Issues", id: "LIST" },
                { type: "Issues", id },
            ],
        }),
        unsubscribeIssue: build.mutation<ApiResponse<IssueT>, string>({
            query: (id) => ({
                url: `issue/${id}/unsubscribe`,
                method: "POST",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "Issues", id: "LIST" },
                { type: "Issues", id },
            ],
        }),
    }),
});
