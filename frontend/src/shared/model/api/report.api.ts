import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse, ListResponse } from "../types";
import { type ListQueryParams } from "../types";
import type { CreateReportT, ReportT } from "../types/report";
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
        createReport: build.mutation<ApiResponse<ReportT>, CreateReportT>({
            query: (body) => ({ url: "report", body, method: "POST" }),
            invalidatesTags: [{ type: "Reports", id: "LIST" }],
        }),
    }),
});
