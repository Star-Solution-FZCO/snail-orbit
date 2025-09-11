import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse, ListResponse } from "../types";
import { type ListQueryParams } from "../types";
import type {
    CreateReportParams,
    GrantReportPermissionParams,
    ReportT,
    UpdateReportParams,
} from "../types/report";
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
        getReport: build.query<ApiResponse<ReportT>, { reportId: string }>({
            query: (params) => ({
                url: `report/${params.reportId}`,
            }),
            providesTags: (result) => [
                { type: "Reports", id: result?.payload.id },
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
            invalidatesTags: [
                {
                    type: "Reports",
                    id: "LIST",
                },
            ],
            async onQueryStarted(
                { id },
                { dispatch, queryFulfilled },
            ): Promise<void> {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        reportApi.util.upsertQueryData(
                            "getReport",
                            { reportId: id },
                            data,
                        ),
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
                        { reportId },
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
    }),
});
