import { createApi } from "@reduxjs/toolkit/query/react";
import {
    ApiResponse,
    CreateProjectT,
    CustomFieldT,
    ListQueryParams,
    ListResponse,
    ProjectDetailT,
    ProjectPermissionT,
    ProjectT,
    TargetTypeT,
    UpdateProjectT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["Projects", "ProjectPermissions"];

export const projectApi = createApi({
    reducerPath: "projectsApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listProject: build.query<
            ListResponse<ProjectT>,
            ListQueryParams | void
        >({
            query: (params) => ({
                url: "project/list",
                params: params ?? undefined,
            }),
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
            ApiResponse<ProjectDetailT>,
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
            ApiResponse<ProjectDetailT>,
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
        addProjectCustomField: build.mutation<
            ApiResponse<ProjectDetailT>,
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
        removeProjectCustomField: build.mutation<
            ApiResponse<ProjectDetailT>,
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
        listProjectAvailableCustomFields: build.query<
            ListResponse<CustomFieldT>,
            { id: string } & ListQueryParams
        >({
            query: ({ id, ...params }) => ({
                url: `project/${id}/field/available/select`,
                params,
            }),
            providesTags: (_result, _error, { id }) => [
                { type: "Projects", id },
            ],
        }),
        addProjectWorkflow: build.mutation<
            ApiResponse<ProjectDetailT>,
            { id: string; workflowId: string }
        >({
            query: ({ id, workflowId }) => ({
                url: `project/${id}/workflow/${workflowId}`,
                method: "POST",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Projects", id },
            ],
        }),
        removeProjectWorkflow: build.mutation<
            ApiResponse<ProjectDetailT>,
            { id: string; workflowId: string }
        >({
            query: ({ id, workflowId }) => ({
                url: `project/${id}/workflow/${workflowId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Projects", id },
            ],
        }),
        getProjectPermissions: build.query<
            ListResponse<ProjectPermissionT>,
            { id: string; params?: ListQueryParams }
        >({
            query: ({ id, params }) => ({
                url: `project/${id}/permissions`,
                params,
            }),
            providesTags: (_result, _error, { id }) => [
                { type: "ProjectPermissions", id },
            ],
        }),
        grantProjectPermission: build.mutation<
            ApiResponse<{ id: string }>,
            {
                id: string;
                target_type: TargetTypeT;
                target_id: string;
                role_id: string;
            }
        >({
            query: ({ id, ...body }) => ({
                url: `project/${id}/permission`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "ProjectPermissions", id },
            ],
        }),
        revokeProjectPermission: build.mutation<
            ApiResponse<{ id: string }>,
            { id: string; permissionId: string }
        >({
            query: ({ id, permissionId }) => ({
                url: `project/${id}/permission/${permissionId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "ProjectPermissions", id },
            ],
        }),
        subscribeProject: build.mutation<ApiResponse<ProjectDetailT>, string>({
            query: (id) => ({
                url: `project/${id}/subscribe`,
                method: "POST",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "Projects", id: "LIST" },
                { type: "Projects", id },
            ],
        }),
        unsubscribeProject: build.mutation<ApiResponse<ProjectDetailT>, string>(
            {
                query: (id) => ({
                    url: `project/${id}/unsubscribe`,
                    method: "POST",
                }),
                invalidatesTags: (_result, _error, id) => [
                    { type: "Projects", id: "LIST" },
                    { type: "Projects", id },
                ],
            },
        ),
    }),
});
