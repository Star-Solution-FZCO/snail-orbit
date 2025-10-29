import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse, ListResponse } from "../types";
import { type ListQueryParams } from "../types";
import type {
    ChangeReportPermissionParams,
    CreateReportParams,
    GrantReportPermissionParams,
    ReportDataT,
    ReportT,
    UpdateReportParams,
} from "../types/report";
import { agileBoardApi } from "./agile_board.api";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["Reports"];

export const reportApi = createApi({
    reducerPath: "reportsApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listReports: build.query<ListResponse<ReportT>, ListQueryParams | void>(
            {
                query: (params) => ({
                    url: "report/list",
                    params: params ?? undefined,
                }),
                providesTags: (result) => {
                    let tags = [{ type: "Reports", id: "LIST" }];
                    if (result) {
                        tags = tags.concat(
                            result.payload.items.map((report) => ({
                                type: "Reports",
                                id: report.id,
                            })),
                        );
                    }
                    return tags;
                },
            },
        ),
        getReport: build.query<ApiResponse<ReportT>, string>({
            query: (id) => ({
                url: `report/${id}`,
            }),
            providesTags: (result) => [
                { type: "Reports", id: result?.payload.id },
            ],
        }),
        getReportData: build.query<
            ApiResponse<ReportDataT>,
            { reportId: string }
        >({
            query: (params) => ({
                url: `report/${params.reportId}/generate`,
                method: "POST",
            }),
            providesTags: (_resp, _err, { reportId }) => [
                { type: "Reports", id: reportId },
                { type: "ReportData", id: reportId },
            ],
        }),
        createReport: build.mutation<ApiResponse<ReportT>, CreateReportParams>({
            query: (body) => ({ url: "report", body, method: "POST" }),
            invalidatesTags: [{ type: "Reports", id: "LIST" }],
        }),
        updateReport: build.mutation<
            ApiResponse<ReportT>,
            UpdateReportParams & { id: string }
        >({
            query: ({ id, ...body }) => ({
                url: `report/${id}`,
                body,
                method: "PUT",
            }),
            invalidatesTags: (_resp, _err, { id }) => [
                {
                    type: "Reports",
                    id: "LIST",
                },
                { type: "ReportData", id },
            ],
            async onQueryStarted(
                { id },
                { dispatch, queryFulfilled },
            ): Promise<void> {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        reportApi.util.upsertQueryData("getReport", id, data),
                    );
                } catch {
                    dispatch(
                        reportApi.util.invalidateTags([
                            { type: "Reports", id },
                        ]),
                    );
                }
            },
        }),
        deleteReport: build.mutation<ApiResponse<{ id: string }>, string>({
            query: (reportId) => ({
                url: `report/${reportId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, reportId) => [
                { type: "Reports", id: reportId },
                {
                    type: "Reports",
                    id: "LIST",
                },
            ],
        }),
        grantPermission: build.mutation<
            ApiResponse<{ id: string }>,
            GrantReportPermissionParams & { reportId: string }
        >({
            query: ({ reportId, ...params }) => ({
                url: `report/${reportId}/permission`,
                method: "POST",
                body: params,
            }),
            invalidatesTags: (_result, _error, { reportId }) => [
                { type: "Reports", id: reportId },
                {
                    type: "Reports",
                    id: "LIST",
                },
            ],
        }),
        revokePermission: build.mutation<
            ApiResponse<{ id: string }>,
            { reportId: string; permissionId: string }
        >({
            query: ({ reportId, permissionId }) => ({
                url: `report/${reportId}/permission/${permissionId}`,
                method: "DELETE",
            }),
            invalidatesTags: () => [
                {
                    type: "Reports",
                    id: "LIST",
                },
            ],
            async onQueryStarted(
                { reportId, permissionId },
                { dispatch, queryFulfilled },
            ): Promise<void> {
                dispatch(
                    reportApi.util.updateQueryData(
                        "getReport",
                        reportId,
                        (draft) => {
                            if (!draft) return;
                            draft.payload.permissions =
                                draft.payload.permissions.filter(
                                    (el) => el.id !== permissionId,
                                );
                        },
                    ),
                );

                try {
                    await queryFulfilled;
                } catch {
                    dispatch(
                        reportApi.util.invalidateTags([
                            { type: "Reports", id: reportId },
                        ]),
                    );
                }
            },
        }),
        changePermission: build.mutation<
            ApiResponse<{ id: string }>,
            ChangeReportPermissionParams
        >({
            query: ({ reportId, permission_id, ...body }) => ({
                url: `report/${reportId}/permission/${permission_id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: () => [
                {
                    type: "Reports",
                    id: "LIST",
                },
            ],
            async onQueryStarted(
                { permission_id, reportId, permission_type },
                { dispatch, queryFulfilled },
            ): Promise<void> {
                dispatch(
                    reportApi.util.updateQueryData(
                        "getReport",
                        reportId,
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
                        agileBoardApi.util.invalidateTags([
                            { type: "Reports", id: reportId },
                        ]),
                    );
                }
            },
        }),
    }),
});
