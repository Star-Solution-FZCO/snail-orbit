import { createApi } from "@reduxjs/toolkit/query/react";
import {
    AgileBoardT,
    AgileSwimLineT,
    ApiResponse,
    ColumnT,
    CreateAgileBoardT,
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
