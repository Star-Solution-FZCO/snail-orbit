import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse, ListResponse } from "../../types";
import { type ListQueryParams } from "../../types";
import type { TagBaseT, TagT } from "../../types/tag";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["Tags"];

export const tagApi = createApi({
    reducerPath: "tagApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listTags: build.query<ListResponse<TagT>, ListQueryParams | void>({
            query: (params) => ({
                url: "tag/list",
                params: params ?? undefined,
            }),
            providesTags: (result) => {
                let tags = [{ type: "Tags", id: "LIST" }];
                if (result) {
                    tags = tags.concat(
                        result.payload.items.map((tag) => ({
                            type: "Tags",
                            id: tag.id,
                        })),
                    );
                }
                return tags;
            },
        }),
        createTag: build.mutation<ApiResponse<TagT>, TagBaseT>({
            query: (body) => ({ url: "tag/", method: "POST", body }),
            invalidatesTags: [{ type: "Tags", id: "LIST" }],
        }),
    }),
});
