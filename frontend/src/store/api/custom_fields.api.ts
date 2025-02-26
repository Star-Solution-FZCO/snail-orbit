import { createApi } from "@reduxjs/toolkit/query/react";
import {
    ApiResponse,
    BasicUserT,
    CreateCustomFieldGroupT,
    CreateCustomFieldT,
    CreateEnumOptionT,
    CreateStateOptionT,
    CreateVersionOptionT,
    CustomFieldGroupT,
    CustomFieldT,
    EnumOptionT,
    ListQueryParams,
    ListResponse,
    StateOptionT,
    TargetTypeT,
    UpdateCustomFieldGroupT,
    UpdateCustomFieldT,
    UpdateEnumOptionT,
    UpdateStateOptionT,
    UpdateVersionOptionT,
    VersionOptionT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["CustomFieldGroups", "CustomFields"];

export const customFieldsApi = createApi({
    reducerPath: "customFieldsApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        // groups
        listCustomFieldGroups: build.query<
            ListResponse<CustomFieldGroupT>,
            ListQueryParams | void
        >({
            query: (params) => ({
                url: "custom_field/group/list",
                params: params ?? undefined,
            }),
            providesTags: (result) => {
                let tags = [{ type: "CustomFieldGroups", id: "LIST" }];
                if (result) {
                    tags = tags.concat(
                        result.payload.items.map((cfg) => ({
                            type: "CustomFieldGroups",
                            id: cfg.gid,
                        })),
                    );
                }
                return tags;
            },
        }),
        getCustomFieldGroup: build.query<
            ApiResponse<CustomFieldGroupT>,
            string
        >({
            query: (gid) => `custom_field/group/${gid}`,
            providesTags: (_result, _error, gid) => [
                { type: "CustomFieldGroups", id: gid },
            ],
        }),
        createCustomFieldGroup: build.mutation<
            ApiResponse<CustomFieldGroupT>,
            CreateCustomFieldGroupT
        >({
            query: (body) => ({
                url: "custom_field/group",
                method: "POST",
                body,
            }),
            invalidatesTags: [
                {
                    type: "CustomFieldGroups",
                    id: "LIST",
                },
            ],
        }),
        updateCustomFieldGroup: build.mutation<
            ApiResponse<CustomFieldGroupT>,
            {
                gid: string;
            } & UpdateCustomFieldGroupT
        >({
            query: ({ gid, ...body }) => ({
                url: `custom_field/group/${gid}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { gid }) => [
                { type: "CustomFieldGroups", id: gid },
            ],
        }),
        // deleteCustomFieldGroup: build.mutation<
        //     ApiResponse<{ id: string }>,
        //     string
        // >({
        //     query: (gid) => ({
        //         url: `custom_field/group/${gid}`,
        //         method: "DELETE",
        //     }),
        //     invalidatesTags: (_result, _error) => [
        //         { type: "CustomFieldGroups", id: "LIST" },
        //     ],
        // }),
        // custom fields
        listCustomFields: build.query<
            ListResponse<CustomFieldT>,
            ListQueryParams | void
        >({
            query: (params) => ({
                url: "custom_field/list",
                params: params ?? undefined,
            }),
            providesTags: (result) => {
                let tags = [{ type: "CustomFields", id: "LIST" }];
                if (result) {
                    tags = tags.concat(
                        result.payload.items.map((cf) => ({
                            type: "CustomFields",
                            id: cf.id,
                        })),
                    );
                }
                return tags;
            },
        }),
        getCustomField: build.query<ApiResponse<CustomFieldT>, string>({
            query: (id) => `custom_field/${id}`,
            providesTags: (_result, _error, id) => [
                { type: "CustomFields", id },
            ],
        }),
        createCustomField: build.mutation<
            ApiResponse<CustomFieldT>,
            { gid: string } & CreateCustomFieldT
        >({
            query: ({ gid, ...body }) => ({
                url: `custom_field/group/${gid}/field`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, { gid }) => [
                {
                    type: "CustomFields",
                    id: "LIST",
                },
                {
                    type: "CustomFieldGroups",
                    id: gid,
                },
            ],
        }),
        updateCustomField: build.mutation<
            ApiResponse<CustomFieldT>,
            {
                gid: string;
                id: string;
            } & UpdateCustomFieldT
        >({
            query: ({ id, ...body }) => ({
                url: `custom_field/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id, gid }) => [
                { type: "CustomFields", id },
                { type: "CustomFieldGroups", id: gid },
            ],
        }),
        deleteCustomField: build.mutation<
            ApiResponse<{ id: string }>,
            { gid: string; id: string }
        >({
            query: ({ id }) => ({
                url: `custom_field/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { gid }) => [
                { type: "CustomFields", id: "LIST" },
                { type: "CustomFieldGroups", id: gid },
            ],
        }),
        // options
        createCustomFieldEnumOption: build.mutation<
            ApiResponse<CustomFieldT>,
            { id: string } & CreateEnumOptionT
        >({
            query: ({ id, ...body }) => ({
                url: `custom_field/${id}/option`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "CustomFields", id },
            ],
        }),
        updateCustomFieldEnumOption: build.mutation<
            ApiResponse<CustomFieldT>,
            { id: string } & UpdateEnumOptionT
        >({
            query: ({ id, option_id, ...body }) => ({
                url: `custom_field/${id}/option/${option_id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "CustomFields", id },
            ],
        }),
        deleteCustomFieldEnumOption: build.mutation<
            ApiResponse<CustomFieldT>,
            { id: string; option_id: string }
        >({
            query: ({ id, option_id }) => ({
                url: `custom_field/${id}/option/${option_id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "CustomFields", id },
            ],
        }),
        createCustomFieldUserOption: build.mutation<
            ApiResponse<CustomFieldT>,
            { id: string; type: TargetTypeT; value: string }
        >({
            query: ({ id, ...body }) => ({
                url: `custom_field/${id}/user-option`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "CustomFields", id },
            ],
        }),
        deleteCustomFieldUserOption: build.mutation<
            ApiResponse<CustomFieldT>,
            { id: string; option_id: string }
        >({
            query: ({ id, option_id }) => ({
                url: `custom_field/${id}/user-option/${option_id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "CustomFields", id },
            ],
        }),
        createCustomFieldStateOption: build.mutation<
            ApiResponse<CustomFieldT>,
            { id: string } & CreateStateOptionT
        >({
            query: ({ id, ...body }) => ({
                url: `custom_field/${id}/state-option`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "CustomFields", id },
            ],
        }),
        updateCustomFieldStateOption: build.mutation<
            ApiResponse<CustomFieldT>,
            { id: string } & UpdateStateOptionT
        >({
            query: ({ id, option_id, ...body }) => ({
                url: `custom_field/${id}/state-option/${option_id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "CustomFields", id },
            ],
        }),
        deleteCustomFieldStateOption: build.mutation<
            ApiResponse<CustomFieldT>,
            { id: string; option_id: string }
        >({
            query: ({ id, option_id }) => ({
                url: `custom_field/${id}/state-option/${option_id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "CustomFields", id },
            ],
        }),
        createCustomFieldVersionOption: build.mutation<
            ApiResponse<CustomFieldT>,
            { id: string } & CreateVersionOptionT
        >({
            query: ({ id, ...body }) => ({
                url: `custom_field/${id}/version-option`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "CustomFields", id },
            ],
        }),
        updateCustomFieldVersionOption: build.mutation<
            ApiResponse<CustomFieldT>,
            { id: string } & UpdateVersionOptionT
        >({
            query: ({ id, option_id, ...body }) => ({
                url: `custom_field/${id}/version-option/${option_id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "CustomFields", id },
            ],
        }),
        deleteCustomFieldVersionOption: build.mutation<
            ApiResponse<CustomFieldT>,
            { id: string; option_id: string }
        >({
            query: ({ id, option_id }) => ({
                url: `custom_field/${id}/version-option/${option_id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "CustomFields", id },
            ],
        }),
        listSelectOptions: build.query<
            ListResponse<
                EnumOptionT | StateOptionT | BasicUserT | VersionOptionT
            >,
            { id: string } & (ListQueryParams | void)
        >({
            query: ({ id, ...params }) => ({
                url: `custom_field/${id}/select`,
                params: params ?? undefined,
            }),
            providesTags: (_result, _error, { id }) => [
                { type: "CustomFieldOption", id },
            ],
        }),
    }),
});
