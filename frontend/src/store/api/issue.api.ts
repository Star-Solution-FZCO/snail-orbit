import { createApi } from "@reduxjs/toolkit/query/react";
import customFetchBase from "store/api/custom_fetch_base.ts";
import { ApiResponse, ListResponse } from "types";
import { CreateIssueT, IssueT, UpdateIssueT } from "types/issue.ts";

const coreTag = "Issues";

const tagTypes = [coreTag];

export const issueApi = createApi({
    reducerPath: "issuesApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listIssues: build.query<ListResponse<IssueT>, void>({
            query: () => "issue/list",
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
    }),
});
