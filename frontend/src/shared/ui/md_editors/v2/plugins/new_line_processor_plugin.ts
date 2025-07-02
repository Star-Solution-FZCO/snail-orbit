import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    COMMAND_PRIORITY_HIGH,
    KEY_ENTER_COMMAND,
} from "lexical";
import { useEffect, type FC } from "react";

export const NewLineProcessorPlugin: FC = () => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            KEY_ENTER_COMMAND,
            () => {
                const selection = $getSelection();

                if (!$isRangeSelection(selection)) {
                    return false;
                }

                const anchorNode = selection.anchor.getNode();
                if ($isTextNode(anchorNode)) {
                    const text = anchorNode.getTextContent();
                    const cursorPosition = selection.anchor.offset;

                    const lines = text.split("\n");
                    let currentPos = 0;
                    let currentLine = "";

                    for (const line of lines) {
                        if (currentPos + line.length >= cursorPosition) {
                            currentLine = line;
                            break;
                        }
                        currentPos += line.length + 1;
                    }

                    if (currentLine.trim() === "") {
                        selection.insertText("\n");
                        return true;
                    }
                }

                selection.insertText("  \n");
                return true;
            },
            COMMAND_PRIORITY_HIGH,
        );
    }, [editor]);

    return null;
};
