import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserT } from "types";

export interface ProfileState {
    user: UserT | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: ProfileState = {
    user: null,
    isLoading: false,
    error: null,
};

const profileSlice = createSlice({
    name: "profile",
    initialState,
    reducers: {
        fetchProfileStart(state) {
            state.isLoading = true;
            state.error = null;
        },
        fetchProfileSuccess(state, action: PayloadAction<UserT>) {
            state.user = action.payload;
            state.isLoading = false;
            state.error = null;
        },
        fetchProfileFailure(state, action: PayloadAction<string>) {
            state.isLoading = false;
            state.error = action.payload;
        },
    },
});

export const { fetchProfileStart, fetchProfileSuccess, fetchProfileFailure } =
    profileSlice.actions;

export const profileReducer = profileSlice.reducer;
