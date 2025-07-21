import type { FC } from "react";
import type { EditorMode } from "../../model/types/settings";
import {
    EDITOR_MODE_DEFAULT_VALUE,
    EDITOR_MODE_KEY,
} from "../../model/types/settings";
import { useLSState } from "../../utils/helpers/local-storage";
import { MDEditorV1 } from "./v1";
import { MDEditorV2 } from "./v2";

export interface MDEditorProps {
    value?: string;
    placeholder?: string;
    onChange?: (value: string) => unknown;
    onBlur?: (value: string) => unknown;
    onFocus?: (value: string) => unknown;
    readOnly?: boolean;
    autoHeight?: boolean;
    autoFocus?: boolean;
}

export const MDEditor: FC<MDEditorProps> = (props) => {
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
