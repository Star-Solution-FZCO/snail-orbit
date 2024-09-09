import { createApi } from "@reduxjs/toolkit/query/react";
import { ApiResponse, ListQueryParams, ListResponse, WorkflowT } from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["Workflows"];

export const workflowApi = createApi({
    reducerPath: "worklowApi",
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
    }),
});
