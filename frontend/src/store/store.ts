import { configureStore } from "@reduxjs/toolkit";
import {
    agileBoardApi,
    customFieldsApi,
    groupApi,
    issueApi,
    projectApi,
    roleApi,
    sharedApi,
    tagApi,
    userApi,
    workflowApi,
} from "./api";
import { searchApi } from "./api/search.api";
import { profileReducer, sharedReducer } from "./slices";

export const store = configureStore({
    devTools: import.meta.env.DEV,
    reducer: {
        profile: profileReducer,
        shared: sharedReducer,
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
        ]),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const appDispatch = store.dispatch;
