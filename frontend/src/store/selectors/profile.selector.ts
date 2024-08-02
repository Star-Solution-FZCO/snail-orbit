import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

export const isAuthenticatedSelector = createSelector(
    (state: RootState) => state.profile,
    (profile) => profile.user !== null,
);
