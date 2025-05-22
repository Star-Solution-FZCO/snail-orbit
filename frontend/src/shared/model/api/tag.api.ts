import { createApi } from "@reduxjs/toolkit/query/react";
import type {
    ListQueryParams,
    ListResponse,
    TagBaseT,
    TagT,
} from "shared/model/types";
import { type ApiResponse } from "shared/model/types";
import customFetchBase from "./custom_fetch_base";
import { issueApi } from "./issue.api";

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
        updateTag: build.mutation<
            ApiResponse<TagT>,
            TagBaseT & Pick<TagT, "id">
        >({
            query: ({ id, ...body }) => ({
                url: `tag/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: [{ type: "Tags", id: "LIST" }],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                await queryFulfilled;
                dispatch(issueApi.util.invalidateTags(["Issues"]));
            },
        }),
    }),
});
