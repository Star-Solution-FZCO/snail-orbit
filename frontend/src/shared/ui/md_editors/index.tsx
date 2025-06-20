import type { FC } from "react";
import { useAppSelector } from "shared/model";
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
    const editorMode = useAppSelector((state) => state.shared.editor.mode);

    switch (editorMode) {
        case "lexical":
            return <MDEditorV2 {...props} />;

        case "ckeditor":
        default:
            return <MDEditorV1 {...props} />;
    }
};

export default MDEditor;
