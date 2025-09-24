import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    REDO_COMMAND,
    UNDO_COMMAND,
} from "lexical";
import { useCallback, useState, type FC } from "react";
import { EditorViewMode } from "shared/model/types/settings";
import {
    FORMAT_BOLD_COMMAND,
    FORMAT_CODE_COMMAND,
    FORMAT_HEADING_COMMAND,
    FORMAT_ITALIC_COMMAND,
    FORMAT_STRIKETHROUGH_COMMAND,
    INSERT_CHECK_LIST_COMMAND,
    INSERT_CODE_BLOCK_COMMAND,
    INSERT_HORIZONTAL_RULE_COMMAND,
    INSERT_LINK_COMMAND,
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_QUOTE_COMMAND,
    INSERT_TABLE_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
} from "../../commands";
import { useRegisterToolbarCommands } from "../../hooks/use-register-toolbar-commands";
import { useToolbarCommands } from "../../hooks/use-toolbar-commands";
import { analyzeSelectedText, detectBlockType, getLineInfo } from "../../utils";
import { Toolbar, ToolbarCallbacks, ToolbarState } from "./components/toolbar";

interface IMarkdownEditorToolbarProps {
    mode: EditorViewMode;
    onModeChange?: (mode: EditorViewMode) => void;
    onChange?: (value: string) => void;
}

export const MarkdownEditorToolbar: FC<IMarkdownEditorToolbarProps> = ({
    mode,
    onModeChange,
    onChange,
}) => {
    const [editor] = useLexicalComposerContext();

    const [toolbarState, setToolbarState] = useState<ToolbarState>({
        canUndo: false,
        canRedo: false,
        blockType: "paragraph",
        isBold: false,
        isItalic: false,
        isStrikethrough: false,
        isQuote: false,
        isCode: false,
        isUnorderedList: false,
        isOrderedList: false,
        isCheckList: false,
        isCodeBlock: false,
        isTable: false,
    });

    const {
        formatHeading,
        formatInlineText,
        insertAtLineStart,
        insertOrderedList,
        insertCodeBlock,
        insertInlineCode,
        insertTable,
        insertLink,
        insertHorizontalRule,
        insertQuote,
    } = useToolbarCommands(editor, (blockType: string) => {
        setToolbarState((prev: ToolbarState) => ({ ...prev, blockType }));
    });

    const analyzeSelection = useCallback((text: string) => {
        return analyzeSelectedText(text);
    }, []);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
            const selectedText = selection.getTextContent();
            const lines = selectedText.split("\n");

            let blockType = "paragraph";

            if (selectedText.length > 0) {
                const anchorNode = selection.anchor.getNode();

                if ($isTextNode(anchorNode)) {
                    const textContent = anchorNode.getTextContent();
                    const { currentLine } = getLineInfo(
                        textContent,
                        selection.anchor.offset,
                    );

                    if (
                        lines.length === 1 ||
                        (lines.length === 2 && lines[1] === "")
                    ) {
                        blockType = detectBlockType(currentLine);
                    }
                }

                const formatting = analyzeSelection(selectedText);

                setToolbarState((prev: ToolbarState) => ({
                    ...prev,
                    blockType,
                    ...formatting,
                }));
            } else {
                const anchorNode = selection.anchor.getNode();

                if ($isTextNode(anchorNode)) {
                    const textContent = anchorNode.getTextContent();

                    if (textContent.length === 0) {
                        blockType = "paragraph";
                    } else {
                        const { currentLine } = getLineInfo(
                            textContent,
                            selection.anchor.offset,
                        );
                        blockType = detectBlockType(currentLine);
                    }
                }

                setToolbarState((prev: ToolbarState) => ({
                    ...prev,
                    blockType,
                    isBold: false,
                    isItalic: false,
                    isStrikethrough: false,
                    isCode: false,
                    isUnorderedList: false,
                    isOrderedList: false,
                    isCheckList: false,
                    isQuote: false,
                    isCodeBlock: false,
                    isTable: false,
                }));
            }
        }
    }, [analyzeSelection]);

    const callbacks: ToolbarCallbacks = {
        onUndo: useCallback(() => {
            editor.dispatchCommand(UNDO_COMMAND, undefined);
        }, [editor]),

        onRedo: useCallback(() => {
            editor.dispatchCommand(REDO_COMMAND, undefined);
        }, [editor]),

        onBlockTypeChange: useCallback(
            (blockType: "paragraph" | "h1" | "h2" | "h3") => {
                editor.dispatchCommand(FORMAT_HEADING_COMMAND, blockType);
            },
            [editor],
        ),

        onFormatText: useCallback(
            (format: "bold" | "italic" | "strikethrough" | "code") => {
                switch (format) {
                    case "bold":
                        editor.dispatchCommand(FORMAT_BOLD_COMMAND, undefined);
                        break;
                    case "italic":
                        editor.dispatchCommand(
                            FORMAT_ITALIC_COMMAND,
                            undefined,
                        );
                        break;
                    case "strikethrough":
                        editor.dispatchCommand(
                            FORMAT_STRIKETHROUGH_COMMAND,
                            undefined,
                        );
                        break;
                    case "code":
                        editor.dispatchCommand(FORMAT_CODE_COMMAND, undefined);
                        break;
                }
            },
            [editor],
        ),

        onInsertQuote: useCallback(() => {
            editor.dispatchCommand(INSERT_QUOTE_COMMAND, undefined);
        }, [editor]),

        onInsertLink: useCallback(() => {
            editor.dispatchCommand(INSERT_LINK_COMMAND, undefined);
        }, [editor]),

        onInsertHorizontalRule: useCallback(() => {
            editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
        }, [editor]),

        onInsertList: useCallback(
            (listType: "bullet" | "number" | "check") => {
                if (listType === "bullet") {
                    editor.dispatchCommand(
                        INSERT_UNORDERED_LIST_COMMAND,
                        undefined,
                    );
                } else if (listType === "number") {
                    editor.dispatchCommand(
                        INSERT_ORDERED_LIST_COMMAND,
                        undefined,
                    );
                } else if (listType === "check") {
                    editor.dispatchCommand(
                        INSERT_CHECK_LIST_COMMAND,
                        undefined,
                    );
                }
            },
            [editor],
        ),

        onInsertCodeBlock: useCallback(() => {
            editor.dispatchCommand(INSERT_CODE_BLOCK_COMMAND, undefined);
        }, [editor]),

        onInsertTable: useCallback(() => {
            editor.dispatchCommand(INSERT_TABLE_COMMAND, undefined);
        }, [editor]),
    };

    useRegisterToolbarCommands({
        editor,
        updateToolbar,
        onChange,
        formatInlineText,
        insertAtLineStart,
        insertOrderedList,
        formatHeading,
        insertCodeBlock,
        insertTable,
        insertLink,
        insertInlineCode,
        insertHorizontalRule,
        insertQuote,
        setCanUndo: (canUndo: boolean) =>
            setToolbarState((prev: ToolbarState) => ({ ...prev, canUndo })),
        setCanRedo: (canRedo: boolean) =>
            setToolbarState((prev: ToolbarState) => ({ ...prev, canRedo })),
    });

    return (
        <Toolbar
            mode={mode}
            state={toolbarState}
            callbacks={callbacks}
            onModeChange={onModeChange}
        />
    );
};
