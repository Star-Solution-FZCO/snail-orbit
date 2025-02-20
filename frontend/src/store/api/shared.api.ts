import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "types";
import customFetchBase from "./custom_fetch_base";

export const sharedApi = createApi({
    reducerPath: "sharedApi",
    baseQuery: customFetchBase,
    endpoints: (build) => ({
        downloadFile: build.query<Blob, string>({
            query: (id) => ({
                url: `files/${id}/download/`,
                responseHandler: async (response) =>
                    window.location.assign(
                        window.URL.createObjectURL(await response.blob()),
                    ),
                cache: "no-cache",
            }),
        }),
        uploadAttachment: build.mutation<ApiResponse<{ id: string }>, FormData>(
            {
                query: (body) => ({ url: "files/", method: "POST", body }),
            },
        ),
        getVersion: build.query<ApiResponse<{ version: string }>, void>({
            query: () => ({
                url: "version",
            }),
        }),
    }),
});
