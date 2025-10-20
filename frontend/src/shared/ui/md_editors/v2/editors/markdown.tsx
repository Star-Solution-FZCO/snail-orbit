import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import {
    InitialConfigType,
    LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { Box, Stack } from "@mui/material";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import type { FC } from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useEditorStyles } from "../hooks/use-editor-styles";
import { FocusBlurPlugin } from "../plugins/focus_blur_plugin";
import { MentionsPlainTextPlugin } from "../plugins/mentions_plaintext_plugin";
import { ToolbarPlugin } from "../plugins/toolbar/toolbar_plugin";
import { theme } from "./theme";
import { EditorProps } from "./types";

export const MDEditor: FC<EditorProps> = ({
    value,
    mode,
    placeholder,
    onChange,
    onModeChange,
    onBlur,
    onFocus,
    readOnly = false,
    autoHeight,
    autoFocus = true,
}) => {
    const { t } = useTranslation();
    const editorStyles = useEditorStyles();

    const handleChange = useCallback(
        (markdownContent: string) => {
            onChange?.(markdownContent);
        },
        [onChange],
    );

    const initialConfig: InitialConfigType = {
        namespace: "MarkdownEditor",
        theme,
        nodes: [],
        editorState: () => {
            const root = $getRoot();
            root.clear();
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(value));
            root.append(paragraph);
        },
        onError: (error) => {
            console.error("Markdown editor error:", error);
        },
        editable: !readOnly,
    };

    return (
        <Stack sx={editorStyles} bgcolor="background.paper" borderRadius={1}>
            <LexicalComposer initialConfig={initialConfig}>
                <ToolbarPlugin
                    mode={mode}
                    onModeChange={onModeChange}
                    onChange={handleChange}
                />

                <PlainTextPlugin
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

                <HistoryPlugin />
                <FocusBlurPlugin onFocus={onFocus} onBlur={onBlur} />
                <MentionsPlainTextPlugin />

                {autoFocus && <AutoFocusPlugin />}
            </LexicalComposer>
        </Stack>
    );
};
