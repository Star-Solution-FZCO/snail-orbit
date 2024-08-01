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

export const projectsApi = createApi({
    reducerPath: "projectsApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listProject: build.query<ListResponse<ProjectT>, void>({
            query: () => "projects",
            providesTags: ["Projects"],
        }),
        getProject: build.query<ApiResponse<ProjectT>, string>({
            query: (id) => `projects/${id}`,
            providesTags: ["Project"],
        }),
        createProject: build.mutation<ApiResponse<ProjectT>, CreateProjectT>({
            query: (body) => ({
                url: "projects",
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
                url: `projects/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Project", "Projects"],
        }),
        deleteProject: build.mutation<void, string>({
            query: (id) => ({
                url: `projects/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Projects"],
        }),
    }),
});
