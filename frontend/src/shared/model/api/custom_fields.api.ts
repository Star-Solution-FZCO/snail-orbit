import { createApi } from "@reduxjs/toolkit/query/react";
import type {
    ApiResponse,
    CreateCustomFieldT,
    CreateEnumOptionT,
    CreateOwnedOptionT,
    CreateStateOptionT,
    CreateVersionOptionT,
    CustomFieldGroupT,
    CustomFieldOptionT,
    CustomFieldT,
    ListQueryParams,
    ListResponse,
    TargetTypeT,
    UpdateCustomFieldGroupT,
    UpdateCustomFieldT,
    UpdateEnumOptionT,
    UpdateOwnedOptionT,
    UpdateStateOptionT,
    UpdateVersionOptionT,
} from "shared/model/types";
import type {
    CustomFieldGroupCreateBody,
    ShortOptionOutput,
    UserOutput,
} from "../types/backend-schema.gen";
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
            CustomFieldGroupCreateBody
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
            query: ({ gid: _, id, ...body }) => ({
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
        copyCustomField: build.mutation<
            ApiResponse<CustomFieldT>,
            { gid: string; id: string; label: string }
        >({
            query: ({ gid, id, label }) => ({
                url: `custom_field/group/${gid}/field/${id}/copy`,
                method: "POST",
                body: { label },
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
        createCustomFieldOwnedOption: build.mutation<
            ApiResponse<CustomFieldT>,
            { id: string } & CreateOwnedOptionT
        >({
            query: ({ id, ...body }) => ({
                url: `custom_field/${id}/owned-option`,
                method: "POST",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "CustomFields", id },
            ],
        }),
        updateCustomFieldOwnedOption: build.mutation<
            ApiResponse<CustomFieldT>,
            { id: string } & UpdateOwnedOptionT
        >({
            query: ({ id, option_id, ...body }) => ({
                url: `custom_field/${id}/owned-option/${option_id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "CustomFields", id },
            ],
        }),
        deleteCustomFieldOwnedOption: build.mutation<
            ApiResponse<CustomFieldT>,
            { id: string; option_id: string }
        >({
            query: ({ id, option_id }) => ({
                url: `custom_field/${id}/owned-option/${option_id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "CustomFields", id },
            ],
        }),
        listSelectOptions: build.query<
            ListResponse<CustomFieldOptionT>,
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
        listGroupSelectOptions: build.query<
            ListResponse<UserOutput | ShortOptionOutput>,
            { gid: string } & (ListQueryParams | void)
        >({
            query: ({ gid, ...params }) => ({
                url: `custom_field/group/${gid}/select`,
                params: params ?? undefined,
            }),
            providesTags: (_result, _error, { gid }) => [
                { type: "CustomFieldGroupOption", gid },
            ],
        }),
    }),
});
