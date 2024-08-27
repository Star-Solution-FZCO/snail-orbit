import { configureStore } from "@reduxjs/toolkit";
import {
    agileBoardApi,
    customFieldsApi,
    groupApi,
    issueApi,
    projectApi,
    roleApi,
    userApi,
    workflowApi,
} from "./api";
import { profileReducer } from "./slices";

export const store = configureStore({
    devTools: import.meta.env.DEV,
    reducer: {
        profile: profileReducer,
        [projectApi.reducerPath]: projectApi.reducer,
        [customFieldsApi.reducerPath]: customFieldsApi.reducer,
        [issueApi.reducerPath]: issueApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        [agileBoardApi.reducerPath]: agileBoardApi.reducer,
        [groupApi.reducerPath]: groupApi.reducer,
        [roleApi.reducerPath]: roleApi.reducer,
        [workflowApi.reducerPath]: workflowApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat([
            projectApi.middleware,
            customFieldsApi.middleware,
            issueApi.middleware,
            userApi.middleware,
            agileBoardApi.middleware,
            groupApi.middleware,
            roleApi.middleware,
            workflowApi.middleware,
        ]),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
