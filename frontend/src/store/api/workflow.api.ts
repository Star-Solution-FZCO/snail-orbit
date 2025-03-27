import { createApi } from "@reduxjs/toolkit/query/react";
import {
    ApiResponse,
    CreateWorkflowT,
    ListQueryParams,
    ListResponse,
    UpdateWorkflowT,
    WorkflowT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["Workflows"];

export const workflowApi = createApi({
    reducerPath: "workflowApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listWorkflow: build.query<
            ListResponse<WorkflowT>,
            ListQueryParams | void
        >({
            query: (params) => ({
                url: "workflow/list",
                params: params ?? undefined,
            }),
            providesTags: (result) => {
                let tags = [{ type: "Workflows", id: "LIST" }];
                if (result) {
                    tags = tags.concat(
                        result.payload.items.map((workflow) => ({
                            type: "Workflows",
                            id: workflow.id,
                        })),
                    );
                }
                return tags;
            },
        }),
        getWorkflow: build.query<ApiResponse<WorkflowT>, string>({
            query: (id) => `workflow/${id}`,
            providesTags: (_result, _error, id) => [{ type: "Workflows", id }],
        }),
        createWorkflow: build.mutation<ApiResponse<WorkflowT>, CreateWorkflowT>(
            {
                query: (body) => ({
                    url: "workflow",
                    method: "POST",
                    body,
                }),
                invalidatesTags: [
                    {
                        type: "Workflows",
                        id: "LIST",
                    },
                ],
            },
        ),
        updateWorkflow: build.mutation<
            ApiResponse<WorkflowT>,
            { id: string } & UpdateWorkflowT
        >({
            query: ({ id, ...body }) => ({
                url: `workflow/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Workflows", id },
            ],
        }),
        deleteWorkflow: build.mutation<ApiResponse<WorkflowT>, string>({
            query: (id) => ({
                url: `workflow/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "Workflows", id },
            ],
        }),
    }),
});
