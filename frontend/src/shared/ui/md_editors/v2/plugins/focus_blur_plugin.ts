import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getRoot,
    BLUR_COMMAND,
    COMMAND_PRIORITY_LOW,
    FOCUS_COMMAND,
} from "lexical";
import { FC, useEffect, useRef } from "react";

export const FocusBlurPlugin: FC<{
    onFocus?: (value: string) => void;
    onBlur?: (value: string) => void;
    autoFocus?: boolean;
}> = ({ onFocus, onBlur, autoFocus }) => {
    const [editor] = useLexicalComposerContext();

    const hasAutoFocused = useRef(false);

    useEffect(() => {
        if (autoFocus && !hasAutoFocused.current) {
            hasAutoFocused.current = true;
            setTimeout(() => {
                editor.focus();
            }, 0);
        }

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
    }, [editor, onFocus, onBlur, autoFocus]);

    return null;
};
