import { createApi } from "@reduxjs/toolkit/query/react";
import type {
    ApiResponse,
    ChangeDashboardPermissionT,
    CreateDashboardT,
    DashboardT,
    GrantDashboardPermissionT,
    ListQueryParams,
    ListResponse,
    PermissionT,
    RevokeDashboardPermissionT,
    UpdateDashboardT,
} from "shared/model/types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["Dashboards"];

export const dashboardApi = createApi({
    reducerPath: "dashboardApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listDashboard: build.query<
            ListResponse<DashboardT>,
            ListQueryParams | void
        >({
            query: (params) => ({
                url: "dashboard/list",
                params: params ?? undefined,
            }),
            providesTags: (result) => {
                let tags = [{ type: "Dashboards", id: "LIST" }];
                if (result) {
                    tags = tags.concat(
                        result.payload.items.map((dashboard) => ({
                            type: "Dashboards",
                            id: dashboard.id,
                        })),
                    );
                }
                return tags;
            },
        }),
        getDashboard: build.query<ApiResponse<DashboardT>, string>({
            query: (id) => `dashboard/${id}`,
            providesTags: (_result, _error, id) => [{ type: "Dashboards", id }],
        }),
        createDashboard: build.mutation<
            ApiResponse<DashboardT>,
            CreateDashboardT
        >({
            query: (body) => ({
                url: "dashboard",
                method: "POST",
                body,
            }),
            invalidatesTags: [
                {
                    type: "Dashboards",
                    id: "LIST",
                },
            ],
        }),
        updateDashboard: build.mutation<
            ApiResponse<DashboardT>,
            { id: string } & UpdateDashboardT
        >({
            query: ({ id, ...body }) => ({
                url: `dashboard/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Dashboards", id },
            ],
        }),
        deleteDashboard: build.mutation<ApiResponse<DashboardT>, string>({
            query: (id) => ({
                url: `dashboard/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "Dashboards", id },
            ],
        }),
        grantPermission: build.mutation<
            ApiResponse<{ id: string }>,
            GrantDashboardPermissionT
        >({
            query: ({ dashboard_id, ...body }) => ({
                url: `dashboard/${dashboard_id}/permission`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, { dashboard_id }) => [
                { type: "Dashboards", id: dashboard_id },
                { type: "Dashboards", id: "LIST" },
            ],
        }),
        changePermission: build.mutation<
            ApiResponse<{ id: string }>,
            ChangeDashboardPermissionT
        >({
            query: ({ dashboard_id, permission_id, ...body }) => ({
                url: `dashboard/${dashboard_id}/permission/${permission_id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: () => [{ type: "Dashboards", id: "LIST" }],
            async onQueryStarted(
                { permission_id, dashboard_id, permission_type },
                { dispatch, queryFulfilled },
            ): Promise<void> {
                dispatch(
                    dashboardApi.util.updateQueryData(
                        "getDashboard",
                        dashboard_id,
                        (draft) => {
                            if (!draft) return;
                            const targetPermission =
                                draft.payload.permissions.find(
                                    (el) => el.id === permission_id,
                                );
                            if (targetPermission)
                                targetPermission.permission_type =
                                    permission_type;
                        },
                    ),
                );

                try {
                    await queryFulfilled;
                } catch {
                    dispatch(
                        dashboardApi.util.invalidateTags([
                            { type: "Dashboards", id: dashboard_id },
                        ]),
                    );
                }
            },
        }),
        revokePermission: build.mutation<
            ApiResponse<{ id: string }>,
            RevokeDashboardPermissionT
        >({
            query: ({ dashboard_id, permission_id }) => ({
                url: `dashboard/${dashboard_id}/permission/${permission_id}`,
                method: "DELETE",
            }),
            invalidatesTags: () => [{ type: "Dashboards", id: "LIST" }],
            async onQueryStarted(
                { permission_id, dashboard_id },
                { dispatch, queryFulfilled },
            ): Promise<void> {
                dispatch(
                    dashboardApi.util.updateQueryData(
                        "getDashboard",
                        dashboard_id,
                        (draft) => {
                            if (!draft) return;
                            draft.payload.permissions =
                                draft.payload.permissions.filter(
                                    (el) => el.id !== permission_id,
                                );
                        },
                    ),
                );

                try {
                    await queryFulfilled;
                } catch {
                    dispatch(
                        dashboardApi.util.invalidateTags([
                            { type: "Dashboards", id: dashboard_id },
                        ]),
                    );
                }
            },
        }),
        getDashboardPermissions: build.query<
            ListResponse<PermissionT>,
            { id: string; params?: ListQueryParams }
        >({
            query: ({ id, params }) => ({
                url: `dashboard/${id}/permissions`,
                params: params ?? undefined,
            }),
            providesTags: (_result, _error, { id }) => [
                { type: "Dashboards", id },
            ],
        }),
    }),
});
