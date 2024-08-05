import { createApi } from "@reduxjs/toolkit/query/react";
import {
    ApiResponse,
    CreateProjectT,
    ListResponse,
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
            providesTags: (result) =>
                result
                    ? result.payload.items.map(({ id }) => ({
                          type: "Projects",
                          id,
                      }))
                    : [{ type: "Projects", id: "LIST" }],
        }),
        getProject: build.query<ApiResponse<ProjectT>, string>({
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
            ApiResponse<ProjectT>,
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
        deleteProject: build.mutation<void, string>({
            query: (id) => ({
                url: `project/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: [
                {
                    type: "Projects",
                    id: "LIST",
                },
            ],
        }),
    }),
});
