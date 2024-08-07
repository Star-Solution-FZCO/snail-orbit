import { createApi } from "@reduxjs/toolkit/query/react";
import {
    ApiResponse,
    CreateProjectT,
    ListResponse,
    ProjectDetailT,
    ProjectT,
    UpdateProjectT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["Projects"];

export const projectApi = createApi({
    reducerPath: "projectsApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listProject: build.query<ListResponse<ProjectT>, void>({
            query: () => "project/list",
            providesTags: (result) => {
                let tags = [{ type: "Projects", id: "LIST" }];
                if (result) {
                    tags = tags.concat(
                        result.payload.items.map((project) => ({
                            type: "Projects",
                            id: project.id,
                        })),
                    );
                }
                return tags;
            },
        }),
        getProject: build.query<ApiResponse<ProjectDetailT>, string>({
            query: (id) => `project/${id}`,
            providesTags: (_result, _error, id) => [{ type: "Projects", id }],
        }),
        createProject: build.mutation<
            ApiResponse<{ id: string }>,
            CreateProjectT
        >({
            query: (body) => ({
                url: "project",
                method: "POST",
                body,
            }),
            invalidatesTags: [
                {
                    type: "Projects",
                    id: "LIST",
                },
            ],
        }),
        updateProject: build.mutation<
            ApiResponse<{ id: string }>,
            { id: string } & UpdateProjectT
        >({
            query: ({ id, ...body }) => ({
                url: `project/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Projects", id },
            ],
        }),
        addCustomField: build.mutation<
            ApiResponse<{ id: string }>,
            { id: string; customFieldId: string }
        >({
            query: ({ id, customFieldId }) => ({
                url: `project/${id}/field/${customFieldId}`,
                method: "POST",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Projects", id },
            ],
        }),
        deleteCustomField: build.mutation<
            ApiResponse<{ id: string }>,
            { id: string; customFieldId: string }
        >({
            query: ({ id, customFieldId }) => ({
                url: `project/${id}/field/${customFieldId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Projects", id },
            ],
        }),
    }),
});
