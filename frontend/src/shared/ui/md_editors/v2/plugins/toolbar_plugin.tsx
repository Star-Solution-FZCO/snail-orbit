import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    Checklist,
    Code,
    DataObject,
    FormatBold,
    FormatItalic,
    FormatListBulleted,
    FormatListNumbered,
    FormatQuote,
    HorizontalRule,
    Link,
    Redo,
    StrikethroughS,
    TableChart,
    Undo,
} from "@mui/icons-material";
import {
    Divider,
    FormControl,
    MenuItem,
    Select,
    Stack,
    Tooltip,
} from "@mui/material";
import {
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    REDO_COMMAND,
    UNDO_COMMAND,
} from "lexical";
import { useCallback, useMemo, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
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
import { useRegisterToolbarCommands } from "../hooks/use-register-toolbar-commands";
import { useToolbarCommands } from "../hooks/use-toolbar-commands";
import { analyzeSelectedText, detectBlockType, getLineInfo } from "../utils";
import { ToolbarButton } from "./toolbar_button";

interface IToolbarPluginProps {
    onChange: (value: string) => void;
}

interface FormatState {
    blockType: string;
    isBold: boolean;
    isItalic: boolean;
    isStrikethrough: boolean;
    isCode: boolean;
    isUnorderedList: boolean;
    isOrderedList: boolean;
    isCheckList: boolean;
    isQuote: boolean;
    isCodeBlock: boolean;
    isTable: boolean;
}

export const ToolbarPlugin: FC<IToolbarPluginProps> = ({ onChange }) => {
    const { t } = useTranslation();
    const [editor] = useLexicalComposerContext();

    const [formatState, setFormatState] = useState<FormatState>({
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
    });

    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

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
        setFormatState((prev) => ({ ...prev, blockType }));
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

                setFormatState((prev) => ({
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

                setFormatState((prev) => ({
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
        setCanUndo,
        setCanRedo,
    });

    const memoizedToolbar = useMemo(
        () => (
            <Stack
                direction="row"
                alignItems="center"
                border={1}
                borderRadius={1}
                borderColor="divider"
                p={0.5}
                gap={0.5}
                color="text.primary"
            >
                <Tooltip title={t("editor.toolbar.undo")}>
                    <span>
                        <ToolbarButton
                            onClick={() =>
                                editor.dispatchCommand(UNDO_COMMAND, undefined)
                            }
                            disabled={!canUndo}
                        >
                            <Undo />
                        </ToolbarButton>
                    </span>
                </Tooltip>

                <Tooltip title={t("editor.toolbar.redo")}>
                    <span>
                        <ToolbarButton
                            onClick={() =>
                                editor.dispatchCommand(REDO_COMMAND, undefined)
                            }
                            disabled={!canRedo}
                        >
                            <Redo />
                        </ToolbarButton>
                    </span>
                </Tooltip>

                <Divider orientation="vertical" flexItem />

                <FormControl sx={{ minWidth: 140 }}>
                    <Select
                        sx={{ height: "32px" }}
                        value={formatState.blockType}
                        onChange={(e) =>
                            editor.dispatchCommand(
                                FORMAT_HEADING_COMMAND,
                                e.target.value,
                            )
                        }
                        displayEmpty
                    >
                        <MenuItem value="paragraph">
                            {t("editor.toolbar.format.paragraph")}
                        </MenuItem>
                        <MenuItem value="h1">
                            {t("editor.toolbar.format.heading1")}
                        </MenuItem>
                        <MenuItem value="h2">
                            {t("editor.toolbar.format.heading2")}
                        </MenuItem>
                        <MenuItem value="h3">
                            {t("editor.toolbar.format.heading3")}
                        </MenuItem>
                    </Select>
                </FormControl>

                <Divider orientation="vertical" flexItem />

                <Tooltip title={t("editor.toolbar.format.bold")}>
                    <ToolbarButton
                        onClick={() =>
                            editor.dispatchCommand(
                                FORMAT_BOLD_COMMAND,
                                undefined,
                            )
                        }
                        active={formatState.isBold}
                    >
                        <FormatBold />
                    </ToolbarButton>
                </Tooltip>

                <Tooltip title={t("editor.toolbar.format.italic")}>
                    <ToolbarButton
                        onClick={() =>
                            editor.dispatchCommand(
                                FORMAT_ITALIC_COMMAND,
                                undefined,
                            )
                        }
                        active={formatState.isItalic}
                    >
                        <FormatItalic />
                    </ToolbarButton>
                </Tooltip>

                <Tooltip title={t("editor.toolbar.format.strikethrough")}>
                    <ToolbarButton
                        onClick={() =>
                            editor.dispatchCommand(
                                FORMAT_STRIKETHROUGH_COMMAND,
                                undefined,
                            )
                        }
                        active={formatState.isStrikethrough}
                    >
                        <StrikethroughS />
                    </ToolbarButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem />

                <Tooltip title={t("editor.toolbar.format.quote")}>
                    <ToolbarButton
                        onClick={() =>
                            editor.dispatchCommand(
                                INSERT_QUOTE_COMMAND,
                                undefined,
                            )
                        }
                        active={formatState.isQuote}
                    >
                        <FormatQuote />
                    </ToolbarButton>
                </Tooltip>

                <Tooltip title={t("editor.toolbar.format.code")}>
                    <ToolbarButton
                        onClick={() =>
                            editor.dispatchCommand(
                                FORMAT_CODE_COMMAND,
                                undefined,
                            )
                        }
                        active={formatState.isCode}
                    >
                        <Code />
                    </ToolbarButton>
                </Tooltip>

                <Tooltip title={t("editor.toolbar.format.link")}>
                    <ToolbarButton
                        onClick={() =>
                            editor.dispatchCommand(
                                INSERT_LINK_COMMAND,
                                undefined,
                            )
                        }
                    >
                        <Link />
                    </ToolbarButton>
                </Tooltip>

                <Tooltip title={t("editor.toolbar.format.horizontalRule")}>
                    <ToolbarButton
                        onClick={() =>
                            editor.dispatchCommand(
                                INSERT_HORIZONTAL_RULE_COMMAND,
                                undefined,
                            )
                        }
                    >
                        <HorizontalRule />
                    </ToolbarButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem />

                <Tooltip title={t("editor.toolbar.format.unorderedList")}>
                    <ToolbarButton
                        onClick={() =>
                            editor.dispatchCommand(
                                INSERT_UNORDERED_LIST_COMMAND,
                                undefined,
                            )
                        }
                        active={formatState.isUnorderedList}
                    >
                        <FormatListBulleted />
                    </ToolbarButton>
                </Tooltip>

                <Tooltip title={t("editor.toolbar.format.orderedList")}>
                    <ToolbarButton
                        onClick={() =>
                            editor.dispatchCommand(
                                INSERT_ORDERED_LIST_COMMAND,
                                undefined,
                            )
                        }
                        active={formatState.isOrderedList}
                    >
                        <FormatListNumbered />
                    </ToolbarButton>
                </Tooltip>

                <Tooltip title={t("editor.toolbar.format.checkList")}>
                    <ToolbarButton
                        onClick={() =>
                            editor.dispatchCommand(
                                INSERT_CHECK_LIST_COMMAND,
                                undefined,
                            )
                        }
                        active={formatState.isCheckList}
                    >
                        <Checklist />
                    </ToolbarButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem />

                <Tooltip title={t("editor.toolbar.format.codeBlock")}>
                    <ToolbarButton
                        onClick={() =>
                            editor.dispatchCommand(
                                INSERT_CODE_BLOCK_COMMAND,
                                undefined,
                            )
                        }
                        active={formatState.isCodeBlock}
                    >
                        <DataObject />
                    </ToolbarButton>
                </Tooltip>

                <Tooltip title={t("editor.toolbar.format.insertTable")}>
                    <ToolbarButton
                        onClick={() =>
                            editor.dispatchCommand(
                                INSERT_TABLE_COMMAND,
                                undefined,
                            )
                        }
                        active={formatState.isTable}
                    >
                        <TableChart />
                    </ToolbarButton>
                </Tooltip>
            </Stack>
        ),
        [editor, formatState, canUndo, canRedo, t],
    );

    return memoizedToolbar;
};
