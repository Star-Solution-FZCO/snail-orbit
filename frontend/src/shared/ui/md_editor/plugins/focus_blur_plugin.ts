import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getRoot,
    BLUR_COMMAND,
    COMMAND_PRIORITY_LOW,
    FOCUS_COMMAND,
} from "lexical";
import { FC, useEffect } from "react";

export const FocusBlurPlugin: FC<{
    onFocus?: (value: string) => void;
    onBlur?: (value: string) => void;
}> = ({ onFocus, onBlur }) => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        const unregisterFocus = editor.registerCommand(
            FOCUS_COMMAND,
            () => {
                if (onFocus) {
                    editor.getEditorState().read(() => {
                        const root = $getRoot();
                        const textContent = root.getTextContent();
                        onFocus(textContent);
                    });
                }
                return false;
            },
            COMMAND_PRIORITY_LOW,
        );

        const unregisterBlur = editor.registerCommand(
            BLUR_COMMAND,
            () => {
                if (onBlur) {
                    editor.getEditorState().read(() => {
                        const root = $getRoot();
                        const textContent = root.getTextContent();
                        onBlur(textContent);
                    });
                }
                return false;
            },
            COMMAND_PRIORITY_LOW,
        );

        return () => {
            unregisterFocus();
            unregisterBlur();
        };
    }, [editor, onFocus, onBlur]);

    return null;
};
