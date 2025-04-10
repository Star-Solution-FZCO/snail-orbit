import { createApi } from "@reduxjs/toolkit/query/react";
import type {
    AddEncryptionKeyParams,
    ApiResponse,
    ListQueryParams,
    ListResponse,
} from "types";
import type { EncryptionKeyT } from "types/encryption_keys";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["EncryptionKeys"];

export const encryptionKeysApi = createApi({
    reducerPath: "encryptionKeysApi",
    baseQuery: customFetchBase,
    tagTypes,
    endpoints: (build) => ({
        listEncryptionKeys: build.query<
            ListResponse<EncryptionKeyT>,
            ListQueryParams | void
        >({
            query: (params) => ({
                url: "settings/encryption_key/list",
                params: params ?? undefined,
            }),
            providesTags: (result) => {
                let tags = [{ type: "EncryptionKeys", id: "LIST" }];
                if (result) {
                    tags = tags.concat(
                        result.payload.items.map((key) => ({
                            type: "EncryptionKeys",
                            id: key.fingerprint,
                        })),
                    );
                }
                return tags;
            },
        }),
        addEncryptionKey: build.mutation<
            ApiResponse<EncryptionKeyT>,
            AddEncryptionKeyParams
        >({
            query: (body) => ({
                url: "settings/encryption_key",
                method: "POST",
                body,
            }),
            invalidatesTags: [
                {
                    type: "EncryptionKeys",
                    id: "LIST",
                },
            ],
        }),
        updateEncryptionKey: build.mutation<
            ApiResponse<EncryptionKeyT>,
            { fingerprint: string; name?: string; is_active?: boolean }
        >({
            query: ({ fingerprint, ...body }) => ({
                url: `settings/encryption_key/${fingerprint}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (result) => [
                { type: "EncryptionKeys", id: "LIST" },
                { type: "EncryptionKeys", id: result?.payload.fingerprint },
            ],
        }),
        deleteEncryptionKey: build.mutation<
            { success: boolean },
            { fingerprint: string }
        >({
            query: ({ fingerprint }) => ({
                url: `settings/encryption_key/${fingerprint}`,
                method: "DELETE",
            }),
            invalidatesTags: [
                {
                    type: "EncryptionKeys",
                    id: "LIST",
                },
            ],
        }),
    }),
});
