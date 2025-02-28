import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse, ListQueryParams, ListResponse } from "types";
import type { CreateSearchT, SearchT } from "types/search";
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
                { type: "Search", id: "LIST" },
                ...(result?.payload.items
                    ? result.payload.items.map((search) => ({
                          type: "Search",
                          id: search.id,
                      }))
                    : []),
            ],
        }),
        createSearch: build.mutation<ApiResponse<SearchT>, CreateSearchT>({
            query: (body) => ({
                url: "search/",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Search", id: "LIST" }],
        }),
        updateSearch: build.mutation<ApiResponse<SearchT>, CreateSearchT>({
            query: ({ id, ...body }) => ({
                url: `search/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Search", id: "LIST" },
                { type: "Search", id },
            ],
        }),
        deleteSearch: build.mutation<
            ApiResponse<{ id: string }>,
            { id: string }
        >({
            query: ({ id }) => ({
                url: `search/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "Search", id: "LIST" },
                { type: "Search", id },
            ],
        }),
    }),
});
