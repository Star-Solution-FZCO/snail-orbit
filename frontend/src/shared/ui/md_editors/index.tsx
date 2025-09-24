import type { FC } from "react";
import type { EditorMode } from "shared/model/types/settings";
import {
    EDITOR_MODE_DEFAULT_VALUE,
    EDITOR_MODE_KEY,
} from "shared/model/types/settings";
import { useLSState } from "shared/utils/helpers/local-storage";
import { MDEditorProps } from "./types";
import { MDEditorV1 } from "./v1";
import { MDEditorV2 } from "./v2";

export const MDEditor: FC<MDEditorProps> = ({ ...props }) => {
    const [editorMode] = useLSState<EditorMode>(
        EDITOR_MODE_KEY,
        EDITOR_MODE_DEFAULT_VALUE,
    );

    switch (editorMode) {
        case "lexical":
            return <MDEditorV2 {...props} />;

        case "ckeditor":
        default:
            return <MDEditorV1 {...props} />;
    }
};

export default MDEditor;
