import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { API_URL, apiVersion } from "config";
import type { AttachmentT } from "types";

type PreviewFile = {
    id: string;
    src: string;
    name: string;
    size: number;
};

const initialPreviewFile: PreviewFile = {
    id: "",
    src: "",
    name: "",
    size: 0,
};

export interface SharedState {
    filePreview: {
        open: boolean;
        currentFile: PreviewFile;
        currentIndex: number;
        files: PreviewFile[];
    };
    issueLinks: {
        open: boolean;
    };
    about: {
        open: boolean;
    };
}

const initialState: SharedState = {
    filePreview: {
        open: false,
        currentFile: initialPreviewFile,
        currentIndex: 0,
        files: [],
    },
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
        setFiles(state, action: PayloadAction<AttachmentT[]>) {
            state.filePreview.files = action.payload.map((attachment) => ({
                id: attachment.id,
                src: API_URL + apiVersion + "/files/" + attachment.id,
                name: attachment.name,
                size: attachment.size,
            }));
        },
        openFilePreview(state, action: PayloadAction<PreviewFile>) {
            state.filePreview.open = true;
            state.filePreview.currentFile = action.payload;
            const currentIndex = state.filePreview.files.findIndex(
                (file) => file.id === action.payload.id,
            );
            state.filePreview.currentIndex = currentIndex;
        },
        closeFilePreview(state) {
            state.filePreview.open = false;
            state.filePreview.currentFile = initialPreviewFile;
            state.filePreview.currentIndex = 0;
        },
        clearFiles(state) {
            state.filePreview.files = [];
            state.filePreview.currentFile = initialPreviewFile;
            state.filePreview.currentIndex = 0;
        },
        setNextFilePreview(state) {
            const newIndex =
                (state.filePreview.currentIndex + 1) %
                state.filePreview.files.length;
            state.filePreview.currentIndex = newIndex;
            state.filePreview.currentFile = state.filePreview.files[newIndex];
        },
        setPreviousFilePreview(state) {
            const newIndex =
                (state.filePreview.currentIndex -
                    1 +
                    state.filePreview.files.length) %
                state.filePreview.files.length;
            state.filePreview.currentIndex = newIndex;
            state.filePreview.currentFile = state.filePreview.files[newIndex];
        },
        selectFilePreviewByIndex(state, action: PayloadAction<number>) {
            const newIndex = action.payload;
            if (newIndex >= 0 && newIndex < state.filePreview.files.length) {
                state.filePreview.currentIndex = newIndex;
                state.filePreview.currentFile =
                    state.filePreview.files[newIndex];
                state.filePreview.open = true;
            }
        },
        toggleIssueLinks(state) {
            state.issueLinks.open = !state.issueLinks.open;
        },
        closeIssueLinks(state) {
            state.issueLinks.open = false;
        },
    },
});

export const {
    setFiles,
    openFilePreview,
    closeFilePreview,
    clearFiles,
    setNextFilePreview,
    setPreviousFilePreview,
    selectFilePreviewByIndex,
    toggleIssueLinks,
    closeIssueLinks,
} = sharedSlice.actions;

export const sharedReducer = sharedSlice.reducer;
