import { $createCodeNode } from "@lexical/code";
import {
    $isListNode,
    INSERT_CHECK_LIST_COMMAND,
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    ListNode,
    REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import {
    $createHeadingNode,
    $createQuoteNode,
    $isHeadingNode,
    $isQuoteNode,
    HeadingTagType,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import {
    $findMatchingParent,
    $getNearestNodeOfType,
    mergeRegister,
} from "@lexical/utils";
import {
    $createParagraphNode,
    $getSelection,
    $isRangeSelection,
    $isRootOrShadowRoot,
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    COMMAND_PRIORITY_CRITICAL,
    FORMAT_TEXT_COMMAND,
    REDO_COMMAND,
    SELECTION_CHANGE_COMMAND,
    UNDO_COMMAND,
} from "lexical";
import { useCallback, useEffect, useState, type FC } from "react";
import { EditorViewMode } from "shared/model/types/settings";
import { Toolbar, ToolbarCallbacks, ToolbarState } from "./components/toolbar";

interface IVisualEditorToolbarProps {
    mode: EditorViewMode;
    onModeChange?: (mode: EditorViewMode) => void;
    onChange?: (value: string) => void;
}

const blockTypeToBlockName = {
    bullet: "Bulleted List",
    check: "Check List",
    code: "Code Block",
    h1: "Heading 1",
    h2: "Heading 2",
    h3: "Heading 3",
    number: "Numbered List",
    paragraph: "Normal",
    quote: "Quote",
} as const;

export const VisualEditorToolbar: FC<IVisualEditorToolbarProps> = ({
    mode,
    onModeChange,
}) => {
    const [editor] = useLexicalComposerContext();

    const [toolbarState, setToolbarState] = useState<ToolbarState>({
        blockType: "paragraph",
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
        canUndo: false,
        canRedo: false,
    });

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            let element =
                anchorNode.getKey() === "root"
                    ? anchorNode
                    : $findMatchingParent(anchorNode, (e) => {
                          const parent = e.getParent();
                          return parent !== null && $isRootOrShadowRoot(parent);
                      });

            if (element === null) {
                element = anchorNode.getTopLevelElementOrThrow();
            }

            setToolbarState((prev: ToolbarState) => ({
                ...prev,
                isBold: selection.hasFormat("bold"),
                isItalic: selection.hasFormat("italic"),
                isStrikethrough: selection.hasFormat("strikethrough"),
                isCode: selection.hasFormat("code"),
            }));

            if ($isListNode(element)) {
                const parentList = $getNearestNodeOfType<ListNode>(
                    anchorNode,
                    ListNode,
                );
                const type = parentList
                    ? parentList.getListType()
                    : element.getListType();
                setToolbarState((prev: ToolbarState) => ({
                    ...prev,
                    blockType: "paragraph",
                    isUnorderedList: type === "bullet",
                    isOrderedList: type === "number",
                    isCheckList: type === "check",
                    isQuote: false,
                    isCodeBlock: false,
                }));
            } else {
                const type = $isHeadingNode(element)
                    ? element.getTag()
                    : element.getType();
                if (type in blockTypeToBlockName) {
                    const isQuote = $isQuoteNode(element);
                    const isCodeBlock = type === "code";
                    const selectableType =
                        type === "h1" || type === "h2" || type === "h3"
                            ? type
                            : "paragraph";

                    setToolbarState((prev: ToolbarState) => ({
                        ...prev,
                        blockType: selectableType,
                        isUnorderedList: false,
                        isOrderedList: false,
                        isCheckList: false,
                        isQuote: isQuote,
                        isCodeBlock: isCodeBlock,
                    }));
                }
            }
        }
    }, [editor]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateToolbar();
                    return false;
                },
                COMMAND_PRIORITY_CRITICAL,
            ),
        );
    }, [editor, updateToolbar]);

    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                CAN_UNDO_COMMAND,
                (payload) => {
                    setToolbarState((prev: ToolbarState) => ({
                        ...prev,
                        canUndo: payload,
                    }));
                    return false;
                },
                COMMAND_PRIORITY_CRITICAL,
            ),
            editor.registerCommand(
                CAN_REDO_COMMAND,
                (payload) => {
                    setToolbarState((prev: ToolbarState) => ({
                        ...prev,
                        canRedo: payload,
                    }));
                    return false;
                },
                COMMAND_PRIORITY_CRITICAL,
            ),
        );
    }, [editor]);

    const formatParagraph = useCallback(() => {
        editor.update(() => {
            const selection = $getSelection();
            $setBlocksType(selection, () => $createParagraphNode());
        });
    }, [editor]);

    const formatHeading = useCallback(
        (headingSize: HeadingTagType) => {
            if (toolbarState.blockType !== headingSize) {
                editor.update(() => {
                    const selection = $getSelection();
                    $setBlocksType(selection, () =>
                        $createHeadingNode(headingSize),
                    );
                });
            }
        },
        [editor, toolbarState.blockType],
    );

    const formatQuote = useCallback(() => {
        if (toolbarState.blockType !== "quote") {
            editor.update(() => {
                const selection = $getSelection();
                $setBlocksType(selection, () => $createQuoteNode());
            });
        }
    }, [editor, toolbarState.blockType]);

    const callbacks: ToolbarCallbacks = {
        onUndo: useCallback(() => {
            editor.dispatchCommand(UNDO_COMMAND, undefined);
        }, [editor]),

        onRedo: useCallback(() => {
            editor.dispatchCommand(REDO_COMMAND, undefined);
        }, [editor]),

        onBlockTypeChange: useCallback(
            (blockType: "paragraph" | "h1" | "h2" | "h3") => {
                if (blockType === "paragraph") {
                    formatParagraph();
                } else {
                    formatHeading(blockType);
                }
            },
            [formatParagraph, formatHeading],
        ),

        onFormatText: useCallback(
            (format: "bold" | "italic" | "strikethrough" | "code") => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
            },
            [editor],
        ),

        onInsertQuote: useCallback(() => {
            formatQuote();
        }, [formatQuote]),

        onInsertLink: useCallback(() => {
            console.log("Link insertion not implemented yet for visual editor");
        }, []),

        onInsertHorizontalRule: useCallback(() => {
            editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
        }, [editor]),

        onInsertList: useCallback(
            (listType: "bullet" | "number" | "check") => {
                if (listType === "bullet") {
                    if (toolbarState.isUnorderedList) {
                        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
                    } else {
                        editor.dispatchCommand(
                            INSERT_UNORDERED_LIST_COMMAND,
                            undefined,
                        );
                    }
                } else if (listType === "number") {
                    if (toolbarState.isOrderedList) {
                        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
                    } else {
                        editor.dispatchCommand(
                            INSERT_ORDERED_LIST_COMMAND,
                            undefined,
                        );
                    }
                } else if (listType === "check") {
                    if (toolbarState.isCheckList) {
                        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
                    } else {
                        editor.dispatchCommand(
                            INSERT_CHECK_LIST_COMMAND,
                            undefined,
                        );
                    }
                }
            },
            [
                editor,
                toolbarState.isUnorderedList,
                toolbarState.isOrderedList,
                toolbarState.isCheckList,
            ],
        ),

        onInsertCodeBlock: useCallback(() => {
            if (toolbarState.blockType !== "code") {
                editor.update(() => {
                    const selection = $getSelection();
                    if (!selection) {
                        return;
                    }
                    if (
                        !$isRangeSelection(selection) ||
                        selection.isCollapsed()
                    ) {
                        $setBlocksType(selection, () => $createCodeNode());
                    } else {
                        const textContent = selection.getTextContent();
                        const codeNode = $createCodeNode();
                        selection.insertNodes([codeNode]);
                        const newSelection = $getSelection();
                        if ($isRangeSelection(newSelection)) {
                            newSelection.insertRawText(textContent);
                        }
                    }
                });
            }
        }, [editor, toolbarState.blockType]),

        onInsertTable: useCallback(() => {
            editor.dispatchCommand(INSERT_TABLE_COMMAND, {
                columns: "3",
                rows: "3",
                includeHeaders: true,
            });
        }, [editor]),
    };

    return (
        <Toolbar
            mode={mode}
            state={toolbarState}
            callbacks={callbacks}
            onModeChange={onModeChange}
        />
    );
};
