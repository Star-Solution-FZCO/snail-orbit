import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type PreviewFile = {
    src: string;
    name: string;
    size: number;
};

const initialPreviewFile: PreviewFile = {
    src: "",
    name: "",
    size: 0,
};

export interface SharedState {
    filePreview: {
        open: boolean;
        file: PreviewFile;
    };
}

const initialState: SharedState = {
    filePreview: {
        open: false,
        file: initialPreviewFile,
    },
};

const sharedSlice = createSlice({
    name: "shared",
    initialState,
    reducers: {
        openFilePreview(state, action: PayloadAction<PreviewFile>) {
            state.filePreview.open = true;
            state.filePreview.file = action.payload;
        },
        closeFilePreview(state) {
            state.filePreview.open = false;
            state.filePreview.file = initialPreviewFile;
        },
    },
});

export const { openFilePreview, closeFilePreview } = sharedSlice.actions;

export const sharedReducer = sharedSlice.reducer;
