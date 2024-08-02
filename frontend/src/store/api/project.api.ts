import { createApi } from "@reduxjs/toolkit/query/react";
import {
    ApiResponse,
    CreateProjectT,
    ListResponse,
    ProjectT,
    UpdateProjectT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["Project", "Projects"];

export const projectApi = createApi({
    reducerPath: "projectsApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listProject: build.query<ListResponse<ProjectT>, void>({
            query: () => "project/list",
            providesTags: ["Projects"],
        }),
        getProject: build.query<ApiResponse<ProjectT>, string>({
            query: (id) => `project/${id}`,
            providesTags: ["Project"],
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
            invalidatesTags: ["Projects"],
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
            invalidatesTags: ["Project", "Projects"],
        }),
        deleteProject: build.mutation<void, string>({
            query: (id) => ({
                url: `project/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Projects"],
        }),
    }),
});
