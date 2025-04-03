import type {
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Mutex } from "async-mutex";
import { API_URL, apiVersion } from "config";
import Cookies from "js-cookie";
import { logout, refreshToken } from "services/auth";
import { logout as logoutAction } from "store/slices";
import type { MFARequiredErrorT, QueryErrorT } from "types";
import { serializeParams } from "utils/helpers/serialize-params";

const mutex = new Mutex();

const baseQuery = () => {
    const headers: { [key: string]: string } = {};
    const csrfAccessToken = Cookies.get("csrf_access_token");
    if (csrfAccessToken) {
        headers["X-CSRF-TOKEN"] = csrfAccessToken;
    }
    return fetchBaseQuery({
        baseUrl: (API_URL || "/api/") + apiVersion,
        credentials: "include",
        headers,
        paramsSerializer: serializeParams,
    });
};

const customBaseQuery: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    await mutex.waitForUnlock();

    let response = await baseQuery()(args, api, extraOptions);

    if (
        response.error &&
        response.error.status === 401 &&
        (response.error as QueryErrorT)?.data.type === "jwt_auth_error"
    ) {
        if (!mutex.isLocked()) {
            const release = await mutex.acquire();
            try {
                await refreshToken();
                response = await baseQuery()(args, api, extraOptions);
            } catch (_) {
                await logout();
                api.dispatch(logoutAction());
            } finally {
                release();
            }
        } else {
            await mutex.waitForUnlock();
            response = await baseQuery()(args, api, extraOptions);
        }
    }

    if (
        response.error &&
        response.error.status === 400 &&
        (response.error as unknown as MFARequiredErrorT)?.mfa_required
    ) {
        await logout();
        api.dispatch(logoutAction());
    }

    return response;
};

export default customBaseQuery;
