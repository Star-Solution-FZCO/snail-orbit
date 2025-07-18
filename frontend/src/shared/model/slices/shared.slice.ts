import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const EDITOR_MODE_STORAGE_KEY = "editorMode";
const ISSUE_LINK_MODE_STORAGE_KEY = "issueLinkMode";

type IssueLinkMode = "short" | "long";

const loadEditorMode = (): "ckeditor" | "lexical" => {
    const stored = localStorage.getItem(EDITOR_MODE_STORAGE_KEY);
    return stored === "lexical" ? "lexical" : "ckeditor";
};

const saveEditorMode = (mode: "ckeditor" | "lexical") => {
    localStorage.setItem(EDITOR_MODE_STORAGE_KEY, mode);
};

const loadIssueLinkMode = (): IssueLinkMode => {
    const stored = localStorage.getItem(ISSUE_LINK_MODE_STORAGE_KEY);
    return stored === "long" ? "long" : "short";
};

const saveIssueLinkMode = (mode: IssueLinkMode) => {
    localStorage.setItem(ISSUE_LINK_MODE_STORAGE_KEY, mode);
};

export interface SharedState {
    issueLinks: {
        open: boolean;
        mode: IssueLinkMode;
    };
    about: {
        open: boolean;
    };
    editor: {
        mode: "ckeditor" | "lexical";
    };
}

const initialState: SharedState = {
    issueLinks: {
        open: false,
        mode: loadIssueLinkMode(),
    },
    about: {
        open: false,
    },
    editor: {
        mode: loadEditorMode(),
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
        setEditorMode(state, action: PayloadAction<"ckeditor" | "lexical">) {
            state.editor.mode = action.payload;
            saveEditorMode(action.payload);
        },
        setIssueLinkMode(state, action: PayloadAction<IssueLinkMode>) {
            state.issueLinks.mode = action.payload;
            saveIssueLinkMode(action.payload);
        },
    },
});

export const {
    toggleIssueLinks,
    closeIssueLinks,
    setEditorMode,
    setIssueLinkMode,
} = sharedSlice.actions;

export const sharedReducer = sharedSlice.reducer;
