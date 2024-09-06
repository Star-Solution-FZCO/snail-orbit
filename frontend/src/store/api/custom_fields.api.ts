import { createApi } from "@reduxjs/toolkit/query/react";
import {
    ApiResponse,
    CreateCustomFieldT,
    CreateEnumOptionT,
    CustomFieldT,
    EnumOptionT,
    ListQueryParams,
    ListResponse,
    UpdateCustomFieldT,
    UpdateEnumOptionT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["CustomFields"];

export const customFieldsApi = createApi({
    reducerPath: "customFieldsApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
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
                        result.payload.items.map((project) => ({
                            type: "CustomFields",
                            id: project.id,
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
            CreateCustomFieldT
        >({
            query: (body) => ({
                url: "custom_field/",
                method: "POST",
                body,
            }),
            invalidatesTags: [
                {
                    type: "CustomFields",
                    id: "LIST",
                },
            ],
        }),
        updateCustomField: build.mutation<
            ApiResponse<CustomFieldT>,
            {
                id: string;
            } & UpdateCustomFieldT
        >({
            query: ({ id, ...body }) => ({
                url: `custom_field/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "CustomFields", id },
            ],
        }),
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
        listSelectOptions: build.query<
            ListResponse<EnumOptionT>,
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
