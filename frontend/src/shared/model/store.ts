import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
    agileBoardApi,
    customFieldsApi,
    encryptionKeysApi,
    groupApi,
    issueApi,
    projectApi,
    reportApi,
    roleApi,
    searchApi,
    sharedApi,
    tagApi,
    userApi,
    workflowApi,
} from "./api";
import { dashboardApi } from "./api/dashboard.api";
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
        [sharedApi.reducerPath]: sharedApi.reducer,
        [tagApi.reducerPath]: tagApi.reducer,
        [searchApi.reducerPath]: searchApi.reducer,
        [encryptionKeysApi.reducerPath]: encryptionKeysApi.reducer,
        [dashboardApi.reducerPath]: dashboardApi.reducer,
        [reportApi.reducerPath]: reportApi.reducer,
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
            sharedApi.middleware,
            tagApi.middleware,
            searchApi.middleware,
            encryptionKeysApi.middleware,
            reportApi.middleware,
            dashboardApi.middleware,
        ]),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const appDispatch = store.dispatch;
