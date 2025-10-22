import { mergeRegister } from "@lexical/utils";
import type { LexicalEditor } from "lexical";
import {
    $getRoot,
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    COMMAND_PRIORITY_LOW,
    SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useEffect } from "react";
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
} from "../commands";

type UseRegisterToolbarCommandsProps = {
    editor: LexicalEditor;
    updateToolbar: () => void;
    onChange?: (textContent: string) => void;
    formatInlineText: (prefix: string, suffix?: string) => void;
    insertAtLineStart: (text: string) => void;
    insertOrderedList: () => void;
    formatHeading: (headingType: string) => void;
    insertCodeBlock: () => void;
    insertTable: () => void;
    insertInlineCode: () => void;
    insertLink: () => void;
    insertHorizontalRule: () => void;
    insertQuote: () => void;
    setCanUndo: (canUndo: boolean) => void;
    setCanRedo: (canRedo: boolean) => void;
};

export const useRegisterToolbarCommands = ({
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
    setCanUndo,
    setCanRedo,
}: UseRegisterToolbarCommandsProps) => {
    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                    const root = $getRoot();
                    const textContent = root.getTextContent();
                    onChange?.(textContent);
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateToolbar();
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                CAN_UNDO_COMMAND,
                (payload) => {
                    setCanUndo(payload);
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                CAN_REDO_COMMAND,
                (payload) => {
                    setCanRedo(payload);
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                FORMAT_BOLD_COMMAND,
                () => {
                    formatInlineText("**");
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                FORMAT_ITALIC_COMMAND,
                () => {
                    formatInlineText("*");
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                FORMAT_STRIKETHROUGH_COMMAND,
                () => {
                    formatInlineText("~~");
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                FORMAT_CODE_COMMAND,
                () => {
                    insertInlineCode();
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                FORMAT_HEADING_COMMAND,
                (headingType: string) => {
                    formatHeading(headingType);
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                INSERT_UNORDERED_LIST_COMMAND,
                () => {
                    insertAtLineStart("- ");
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                INSERT_ORDERED_LIST_COMMAND,
                () => {
                    insertOrderedList();
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                INSERT_CHECK_LIST_COMMAND,
                () => {
                    insertAtLineStart("- [ ] ");
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                INSERT_QUOTE_COMMAND,
                () => {
                    insertQuote();
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                INSERT_CODE_BLOCK_COMMAND,
                () => {
                    insertCodeBlock();
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                INSERT_LINK_COMMAND,
                () => {
                    insertLink();
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                INSERT_HORIZONTAL_RULE_COMMAND,
                () => {
                    insertHorizontalRule();
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                INSERT_TABLE_COMMAND,
                () => {
                    insertTable();
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),
        );
    }, [
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
        insertHorizontalRule,
        insertQuote,
        setCanUndo,
        setCanRedo,
    ]);
};
