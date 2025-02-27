import { createApi } from "@reduxjs/toolkit/query/react";
import type { ListQueryParams, ListResponse } from "../../types";
import type { SearchT } from "../../types/search";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["Search"];

export const searchApi = createApi({
    reducerPath: "searchApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listSearches: build.query<
            ListResponse<SearchT>,
            ListQueryParams | void
        >({
            query: (params) => ({
                url: "search/list",
                params: params ?? undefined,
            }),
            providesTags: (result) => [
                { type: "Tags", id: "LIST" },
                ...(result?.payload.items
                    ? result.payload.items.map((tag) => ({
                          type: "Tags",
                          id: tag.id,
                      }))
                    : []),
            ],
        }),
    }),
});
