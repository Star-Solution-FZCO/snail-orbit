import { createApi } from "@reduxjs/toolkit/query/react";
import {
    AgileBoardT,
    ApiResponse,
    CreateAgileBoardT,
    ListQueryParams,
    ListResponse,
    UpdateAgileBoardT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["AgileBoards"];

export const agileBoardApi = createApi({
    reducerPath: "agileBoardApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listAgileBoard: build.query<
            ListResponse<AgileBoardT>,
            ListQueryParams | void
        >({
            query: (params) => ({
                url: "board/list",
                params: params ?? undefined,
            }),
            providesTags: (result) => {
                let tags = [{ type: "AgileBoards", id: "LIST" }];
                if (result) {
                    tags = tags.concat(
                        result.payload.items.map((board) => ({
                            type: "AgileBoards",
                            id: board.id,
                        })),
                    );
                }
                return tags;
            },
        }),
        getAgileBoard: build.query<ApiResponse<AgileBoardT>, string>({
            query: (id) => `board/${id}`,
            providesTags: (_result, _error, id) => [
                { type: "AgileBoards", id },
            ],
        }),
        createAgileBoard: build.mutation<
            ApiResponse<AgileBoardT>,
            CreateAgileBoardT
        >({
            query: (body) => ({
                url: "board",
                method: "POST",
                body,
            }),
            invalidatesTags: [
                {
                    type: "AgileBoards",
                    id: "LIST",
                },
            ],
        }),
        updateAgileBoard: build.mutation<
            ApiResponse<AgileBoardT>,
            { id: string } & UpdateAgileBoardT
        >({
            query: ({ id, ...body }) => ({
                url: `board/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "AgileBoards", id },
            ],
        }),
        deleteAgileBoard: build.mutation<ApiResponse<AgileBoardT>, string>({
            query: (id) => ({
                url: `board/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "AgileBoards", id },
            ],
        }),
    }),
});
