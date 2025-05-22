import { createSlice } from "@reduxjs/toolkit";

export interface SharedState {
    issueLinks: {
        open: boolean;
    };
    about: {
        open: boolean;
    };
}

const initialState: SharedState = {
    issueLinks: {
        open: false,
    },
    about: {
        open: false,
    },
};

const sharedSlice = createSlice({
    name: "shared",
    initialState,
    reducers: {
        toggleIssueLinks(state) {
            state.issueLinks.open = !state.issueLinks.open;
        },
        closeIssueLinks(state) {
            state.issueLinks.open = false;
        },
    },
});

export const { toggleIssueLinks, closeIssueLinks } = sharedSlice.actions;

export const sharedReducer = sharedSlice.reducer;
