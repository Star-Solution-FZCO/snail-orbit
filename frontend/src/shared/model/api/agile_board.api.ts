import { createApi } from "@reduxjs/toolkit/query/react";
import deepmerge from "deepmerge";
import type {
    AgileBoardCardFieldT,
    AgileBoardT,
    ApiResponse,
    BoardIssuesT,
    ChangePermissionParams,
    CreateAgileBoardT,
    CustomFieldGroupLinkT,
    GrantPermissionParams,
    ListQueryParams,
    ListResponse,
    MoveIssueT,
    RevokePermissionParams,
    RolePermissionT,
    UpdateAgileBoardT,
} from "shared/model/types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["AgileBoards", "AgileBoardIssue", "AgileBoardIssues"];

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
            ListResponse<AgileBoardCardFieldT>,
            { project_id: string[] }
        >({
            query: (params) => ({
                url: "board/column_field/select",
                params,
            }),
        }),
        listAvailableSwimlanes: build.query<
            ListResponse<AgileBoardCardFieldT>,
            { project_id: string[] }
        >({
            query: (params) => ({
                url: "board/swimlane_field/select",
                params,
            }),
        }),
        listAvailableCustomFields: build.query<
            ListResponse<CustomFieldGroupLinkT>,
            { project_id: string[] }
        >({
            query: (params) => ({
                url: "board/custom_field/select",
                params,
            }),
        }),
        listAvailableColorsCustomFields: build.query<
            ListResponse<CustomFieldGroupLinkT>,
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
            ApiResponse<BoardIssuesT>,
            { boardId: string; q?: string }
        >({
            query: ({ boardId, ...params }) => ({
                url: `board/${boardId}/issues`,
                method: "GET",
                params,
            }),
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
        getBoardPermissions: build.query<
            ListResponse<RolePermissionT>,
            { boardId: string }
        >({
            query: ({ boardId }) => `board/${boardId}/permissions`,
            providesTags: (_result, _error, { boardId }) => [
                { type: "AgileBoardPermissions", id: boardId },
            ],
        }),
        grantPermission: build.mutation<
            ApiResponse<{ id: string }>,
            GrantPermissionParams
        >({
            query: ({ board_id, ...params }) => ({
                url: `board/${board_id}/permission`,
                method: "POST",
                body: params,
            }),
            invalidatesTags: (_result, _error, { board_id }) => [
                { type: "AgileBoards", id: board_id },
                {
                    type: "AgileBoards",
                    id: "LIST",
                },
            ],
        }),
        revokePermission: build.mutation<
            ApiResponse<{ id: string }>,
            RevokePermissionParams
        >({
            query: ({ board_id, permission_id }) => ({
                url: `board/${board_id}/permission/${permission_id}`,
                method: "DELETE",
            }),
            invalidatesTags: () => [
                {
                    type: "AgileBoards",
                    id: "LIST",
                },
            ],
            async onQueryStarted(
                { permission_id, board_id },
                { dispatch, queryFulfilled },
            ): Promise<void> {
                dispatch(
                    agileBoardApi.util.updateQueryData(
                        "getAgileBoard",
                        board_id,
                        (draft) => {
                            if (!draft) return;
                            draft.payload.permissions =
                                draft.payload.permissions.filter(
                                    (el) => el.id !== permission_id,
                                );
                        },
                    ),
                );

                try {
                    await queryFulfilled;
                } catch {
                    dispatch(
                        agileBoardApi.util.invalidateTags([
                            { type: "AgileBoards", id: board_id },
                        ]),
                    );
                }
            },
        }),
        changePermission: build.mutation<
            ApiResponse<{ id: string }>,
            ChangePermissionParams
        >({
            query: ({ board_id, permission_id, ...body }) => ({
                url: `board/${board_id}/permission/${permission_id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: () => [
                {
                    type: "AgileBoards",
                    id: "LIST",
                },
            ],
            async onQueryStarted(
                { permission_id, board_id, permission_type },
                { dispatch, queryFulfilled },
            ): Promise<void> {
                dispatch(
                    agileBoardApi.util.updateQueryData(
                        "getAgileBoard",
                        board_id,
                        (draft) => {
                            if (!draft) return;
                            const targetPermission =
                                draft.payload.permissions.find(
                                    (el) => el.id === permission_id,
                                );
                            if (targetPermission)
                                targetPermission.permission_type =
                                    permission_type;
                        },
                    ),
                );

                try {
                    await queryFulfilled;
                } catch {
                    dispatch(
                        agileBoardApi.util.invalidateTags([
                            { type: "AgileBoards", id: board_id },
                        ]),
                    );
                }
            },
        }),
    }),
});
