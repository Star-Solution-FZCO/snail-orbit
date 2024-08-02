import {
    BaseQueryFn,
    FetchArgs,
    fetchBaseQuery,
    FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { Mutex } from "async-mutex";
import { API_URL, apiVersion } from "config";
import { logout, refreshToken } from "services/auth";
import { logout as logoutAction } from "store/slices";
import { QueryErrorT } from "types";

const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
    baseUrl: (API_URL || "/api/") + apiVersion,
    credentials: "include",
});

const customBaseQuery: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    await mutex.waitForUnlock();

    let response = await baseQuery(args, api, extraOptions);

    if (
        response.error &&
        response.error.status === 401 &&
        (response.error as QueryErrorT)?.data.type === "token_expired"
    ) {
        if (!mutex.isLocked()) {
            const release = await mutex.acquire();
            try {
                const refreshResponse = await refreshToken();
                if (refreshResponse.data) {
                    response = await baseQuery(args, api, extraOptions);
                } else {
                    logout()
                        .then()
                        .finally(() => {
                            api.dispatch(logoutAction());
                        });
                }
            } finally {
                release();
            }
        } else {
            await mutex.waitForUnlock();
            response = await baseQuery(args, api, extraOptions);
        }
    }
    return response;
};

export default customBaseQuery;
