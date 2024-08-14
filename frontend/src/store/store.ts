import { configureStore } from "@reduxjs/toolkit";
import { customFieldsApi, issueApi, projectApi, userApi } from "./api";
import { profileReducer } from "./slices";

export const store = configureStore({
    devTools: import.meta.env.DEV,
    reducer: {
        profile: profileReducer,
        [projectApi.reducerPath]: projectApi.reducer,
        [issueApi.reducerPath]: issueApi.reducer,
        [customFieldsApi.reducerPath]: customFieldsApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat([
            projectApi.middleware,
            customFieldsApi.middleware,
            userApi.middleware,
            issueApi.middleware,
        ]),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
