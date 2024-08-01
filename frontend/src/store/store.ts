import { configureStore } from "@reduxjs/toolkit";
import { projectsApi } from "./api";
import { profileReducer } from "./slices"; // Rename or alias the import

export const store = configureStore({
    devTools: import.meta.env.DEV,
    reducer: {
        profile: profileReducer,
        [projectsApi.reducerPath]: projectsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(projectsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
