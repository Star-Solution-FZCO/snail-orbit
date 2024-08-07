import { createApi } from "@reduxjs/toolkit/query/react";
import { ApiResponse, UserT } from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["Users"];

export const userApi = createApi({
    reducerPath: "userApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        getProfile: build.query<ApiResponse<UserT>, void>({
            query: () => "profile/",
            providesTags: (_result, _error) => [
                { type: "Users", id: "PROFILE" },
            ],
        }),
    }),
});
