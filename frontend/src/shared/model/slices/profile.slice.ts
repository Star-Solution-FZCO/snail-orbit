import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { ProfileT } from "shared/model/types";

export interface ProfileState {
    user: ProfileT | null;
}

const initialState: ProfileState = {
    user: null,
};

const loadStateFromLocalStorage = (): ProfileState => {
    const savedState = localStorage.getItem("profile");
    if (savedState) {
        return JSON.parse(savedState);
    }
    return initialState;
};

const profileSlice = createSlice({
    name: "profile",
    initialState: loadStateFromLocalStorage(),
    reducers: {
        setUser(state, action: PayloadAction<ProfileT>) {
            state.user = action.payload;
            localStorage.setItem("profile", JSON.stringify(state));
        },
        logout(state) {
            state.user = null;
            localStorage.clear();
        },
    },
});

export const { setUser, logout } = profileSlice.actions;

export const profileReducer = profileSlice.reducer;
