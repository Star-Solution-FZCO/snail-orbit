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
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { EditorViewMode } from "shared/model/types/settings";
import { ModeSwitcher } from "./mode_switcher";
import { ToolbarButton } from "./toolbar_button";

export interface ToolbarState {
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
    canUndo: boolean;
    canRedo: boolean;
}

export interface ToolbarCallbacks {
    onUndo: () => void;
    onRedo: () => void;
    onBlockTypeChange: (blockType: "paragraph" | "h1" | "h2" | "h3") => void;
    onFormatText: (
        format: "bold" | "italic" | "strikethrough" | "code",
    ) => void;
    onInsertQuote: () => void;
    onInsertLink: () => void;
    onInsertHorizontalRule: () => void;
    onInsertList: (listType: "bullet" | "number" | "check") => void;
    onInsertCodeBlock: () => void;
    onInsertTable: () => void;
}

interface ToolbarProps {
    mode: EditorViewMode;
    state: ToolbarState;
    callbacks: ToolbarCallbacks;
    onModeChange?: (mode: EditorViewMode) => void;
}

export const Toolbar: FC<ToolbarProps> = ({
    mode,
    state,
    callbacks,
    onModeChange,
}) => {
    const { t } = useTranslation();

    return (
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
                        onClick={callbacks.onUndo}
                        disabled={!state.canUndo}
                    >
                        <Undo />
                    </ToolbarButton>
                </span>
            </Tooltip>

            <Tooltip title={t("editor.toolbar.redo")}>
                <span>
                    <ToolbarButton
                        onClick={callbacks.onRedo}
                        disabled={!state.canRedo}
                    >
                        <Redo />
                    </ToolbarButton>
                </span>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            <FormControl sx={{ minWidth: 140 }}>
                <Select
                    sx={{ height: "32px" }}
                    value={state.blockType}
                    onChange={(e) =>
                        callbacks.onBlockTypeChange(e.target.value as any)
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
                <span>
                    <ToolbarButton
                        onClick={() => callbacks.onFormatText("bold")}
                        active={state.isBold}
                    >
                        <FormatBold />
                    </ToolbarButton>
                </span>
            </Tooltip>

            <Tooltip title={t("editor.toolbar.format.italic")}>
                <span>
                    <ToolbarButton
                        onClick={() => callbacks.onFormatText("italic")}
                        active={state.isItalic}
                    >
                        <FormatItalic />
                    </ToolbarButton>
                </span>
            </Tooltip>

            <Tooltip title={t("editor.toolbar.format.strikethrough")}>
                <span>
                    <ToolbarButton
                        onClick={() => callbacks.onFormatText("strikethrough")}
                        active={state.isStrikethrough}
                    >
                        <StrikethroughS />
                    </ToolbarButton>
                </span>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            <Tooltip title={t("editor.toolbar.format.quote")}>
                <span>
                    <ToolbarButton
                        onClick={callbacks.onInsertQuote}
                        active={state.isQuote}
                    >
                        <FormatQuote />
                    </ToolbarButton>
                </span>
            </Tooltip>

            <Tooltip title={t("editor.toolbar.format.code")}>
                <span>
                    <ToolbarButton
                        onClick={() => callbacks.onFormatText("code")}
                        active={state.isCode}
                        disabled={mode == "visual"}
                    >
                        <Code />
                    </ToolbarButton>
                </span>
            </Tooltip>

            <Tooltip title={t("editor.toolbar.format.link")}>
                <span>
                    <ToolbarButton
                        onClick={callbacks.onInsertLink}
                        disabled={mode == "visual"}
                    >
                        <Link />
                    </ToolbarButton>
                </span>
            </Tooltip>

            <Tooltip title={t("editor.toolbar.format.horizontalRule")}>
                <span>
                    <ToolbarButton onClick={callbacks.onInsertHorizontalRule}>
                        <HorizontalRule />
                    </ToolbarButton>
                </span>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            <Tooltip title={t("editor.toolbar.format.unorderedList")}>
                <span>
                    <ToolbarButton
                        onClick={() => callbacks.onInsertList("bullet")}
                        active={state.isUnorderedList}
                    >
                        <FormatListBulleted />
                    </ToolbarButton>
                </span>
            </Tooltip>

            <Tooltip title={t("editor.toolbar.format.orderedList")}>
                <span>
                    <ToolbarButton
                        onClick={() => callbacks.onInsertList("number")}
                        active={state.isOrderedList}
                    >
                        <FormatListNumbered />
                    </ToolbarButton>
                </span>
            </Tooltip>

            <Tooltip title={t("editor.toolbar.format.checkList")}>
                <span>
                    <ToolbarButton
                        onClick={() => callbacks.onInsertList("check")}
                        active={state.isCheckList}
                    >
                        <Checklist />
                    </ToolbarButton>
                </span>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            <Tooltip title={t("editor.toolbar.format.codeBlock")}>
                <span>
                    <ToolbarButton
                        onClick={callbacks.onInsertCodeBlock}
                        active={state.isCodeBlock}
                    >
                        <DataObject />
                    </ToolbarButton>
                </span>
            </Tooltip>

            <Tooltip title={t("editor.toolbar.format.insertTable")}>
                <span>
                    <ToolbarButton
                        onClick={callbacks.onInsertTable}
                        active={state.isTable}
                    >
                        <TableChart />
                    </ToolbarButton>
                </span>
            </Tooltip>

            {onModeChange && (
                <>
                    <Divider orientation="vertical" flexItem />
                    <ModeSwitcher mode={mode} onChange={onModeChange} />
                </>
            )}
        </Stack>
    );
};
