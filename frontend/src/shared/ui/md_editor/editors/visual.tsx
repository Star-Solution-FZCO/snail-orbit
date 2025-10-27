import { CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import {
    $convertFromMarkdownString,
    $convertToMarkdownString,
} from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import {
    InitialConfigType,
    LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { SelectionAlwaysOnDisplay } from "@lexical/react/LexicalSelectionAlwaysOnDisplay";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { Box, Stack } from "@mui/material";
import { $createParagraphNode, $getRoot, EditorState } from "lexical";
import type { FC } from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useEditorStyles } from "../hooks/use-editor-styles";
import { MentionNode } from "../nodes/mention_node";
import { FocusBlurPlugin } from "../plugins/focus_blur_plugin";
import { MentionsPlugin } from "../plugins/mentions_plugin";
import { ToolbarPlugin } from "../plugins/toolbar/toolbar_plugin";
import { TRANSFORMERS } from "../transformers";
import { theme } from "./theme";
import { EditorProps } from "./types";

const URL_MATCHER =
    /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const LINK_MATCHERS = [
    (text: string) => {
        const match = URL_MATCHER.exec(text);
        if (match === null) {
            return null;
        }
        const fullMatch = match[0];
        return {
            index: match.index,
            length: fullMatch.length,
            text: fullMatch,
            url: fullMatch.startsWith("http")
                ? fullMatch
                : `https://${fullMatch}`,
            attributes: { rel: "noreferrer", target: "_blank" },
        };
    },
];

export const VisualEditor: FC<EditorProps> = ({
    value,
    mode,
    placeholder,
    onChange,
    onBlur,
    onFocus,
    onModeChange,
    readOnly = false,
    autoHeight,
    autoFocus = true,
}) => {
    const { t } = useTranslation();
    const editorStyles = useEditorStyles();

    const handleChange = useCallback(
        (editorState: EditorState) => {
            editorState.read(() => {
                const markdown = $convertToMarkdownString(TRANSFORMERS);
                console.log("Current Markdown:", markdown);
                onChange?.(markdown);
            });
        },
        [onChange],
    );

    const initialConfig: InitialConfigType = {
        namespace: "VisualEditor",
        theme,
        nodes: [
            HeadingNode,
            QuoteNode,
            ListNode,
            ListItemNode,
            LinkNode,
            AutoLinkNode,
            CodeNode,
            TableNode,
            TableCellNode,
            TableRowNode,
            HorizontalRuleNode,
            MentionNode,
        ],
        editorState: () => {
            if (value) {
                $convertFromMarkdownString(value, TRANSFORMERS);
            } else {
                const root = $getRoot();
                root.clear();
                const paragraph = $createParagraphNode();
                root.append(paragraph);
            }
        },
        onError: (error) => {
            console.error("Visual editor error:", error);
        },
        editable: !readOnly,
    };

    return (
        <Stack sx={editorStyles} bgcolor="background.paper" borderRadius={1}>
            <LexicalComposer initialConfig={initialConfig}>
                <ToolbarPlugin
                    mode={mode}
                    onModeChange={onModeChange}
                    onChange={onChange}
                />

                <RichTextPlugin
                    contentEditable={
                        <Box className="editor-scroller">
                            <Box className="editor">
                                <ContentEditable
                                    className={
                                        autoHeight
                                            ? "content_editable__root autoheight"
                                            : "content_editable__root"
                                    }
                                    placeholder={
                                        <Box
                                            className="content_editable__placeholder"
                                            color="text.secondary"
                                        >
                                            {placeholder || t("text")}
                                        </Box>
                                    }
                                    aria-placeholder={placeholder || t("text")}
                                />
                            </Box>
                        </Box>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                />

                <OnChangePlugin onChange={handleChange} />
                <HistoryPlugin />
                <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                <ListPlugin />
                <CheckListPlugin />
                <LinkPlugin />
                <AutoLinkPlugin matchers={LINK_MATCHERS} />
                <ClickableLinkPlugin />
                <TablePlugin />
                <HorizontalRulePlugin />
                <TabIndentationPlugin />
                <ClearEditorPlugin />
                <SelectionAlwaysOnDisplay />
                <FocusBlurPlugin onFocus={onFocus} onBlur={onBlur} />
                <MentionsPlugin />

                {autoFocus && <AutoFocusPlugin />}
            </LexicalComposer>
        </Stack>
    );
};
