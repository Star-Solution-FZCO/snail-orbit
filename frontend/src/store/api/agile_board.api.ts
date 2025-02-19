import { createApi } from "@reduxjs/toolkit/query/react";
import deepmerge from "deepmerge";
import type {
    AgileBoardT,
    AgileSwimLineT,
    ApiResponse,
    ColumnT,
    CreateAgileBoardT,
    CustomFieldT,
    ListQueryParams,
    ListResponse,
    MoveIssueT,
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
        listAvailableColumns: build.query<
            ListResponse<ColumnT>,
            { project_id: string[] }
        >({
            query: (params) => ({
                url: "board/column_field/select",
                params,
            }),
        }),
        listAvailableSwimlanes: build.query<
            ListResponse<ColumnT>,
            { project_id: string[] }
        >({
            query: (params) => ({
                url: "board/swimlane_field/select",
                params,
            }),
        }),
        listAvailableCustomFields: build.query<
            ListResponse<CustomFieldT>,
            { project_id: string[] }
        >({
            query: (params) => ({
                url: "board/custom_field/select",
                params,
            }),
        }),
        listAvailableColorsCustomFields: build.query<
            ListResponse<CustomFieldT>,
            { project_id: string[] }
        >({
            query: (params) => ({
                url: "board/card_color_field/select",
                params,
            }),
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
            invalidatesTags: [
                {
                    type: "AgileBoards",
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
                        agileBoardApi.util.upsertQueryData(
                            "getAgileBoard",
                            id,
                            data,
                        ),
                    );
                } catch {
                    dispatch(
                        agileBoardApi.util.invalidateTags([
                            { type: "AgileBoards", id },
                        ]),
                    );
                }
            },
        }),
        favoriteBoard: build.mutation<
            ApiResponse<AgileBoardT>,
            { boardId: string; favorite: boolean }
        >({
            query: ({ boardId, favorite }) => ({
                url: `board/${boardId}/${favorite ? "favorite" : "unfavorite"}`,
                method: "POST",
            }),
            invalidatesTags: [
                {
                    type: "AgileBoards",
                    id: "LIST",
                },
            ],
            async onQueryStarted(
                { boardId, favorite },
                { dispatch, queryFulfilled },
            ): Promise<void> {
                dispatch(
                    agileBoardApi.util.updateQueryData(
                        "getAgileBoard",
                        boardId,
                        (draft) =>
                            deepmerge(draft, {
                                payload: { is_favorite: favorite },
                            }),
                    ),
                );

                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        agileBoardApi.util.upsertQueryData(
                            "getAgileBoard",
                            boardId,
                            data,
                        ),
                    );
                } catch {
                    dispatch(
                        agileBoardApi.util.invalidateTags([
                            { type: "AgileBoards", id: boardId },
                        ]),
                    );
                }
            },
        }),
        deleteAgileBoard: build.mutation<ApiResponse<AgileBoardT>, string>({
            query: (id) => ({
                url: `board/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "AgileBoards", id },
                {
                    type: "AgileBoards",
                    id: "LIST",
                },
            ],
        }),
        getBoardIssues: build.query<
            ListResponse<AgileSwimLineT>,
            { boardId: string }
        >({
            query: ({ boardId }) => `board/${boardId}/issues`,
            providesTags: (_result, _error, { boardId }) => [
                { type: "AgileBoardIssues", id: boardId },
            ],
        }),
        moveIssue: build.mutation<ApiResponse<{ id: string }>, MoveIssueT>({
            query: ({ issue_id, board_id, ...params }) => ({
                url: `board/${board_id}/issues/${issue_id}`,
                method: "PUT",
                body: params,
            }),
            invalidatesTags: (_result, _error, { board_id }) => [
                { type: "AgileBoardIssues", id: board_id },
            ],
        }),
    }),
});
