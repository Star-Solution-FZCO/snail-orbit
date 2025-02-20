import { CKEditor } from "@ckeditor/ckeditor5-react";
import { Box, useTheme } from "@mui/material";
import type { DowncastWriter, EventInfo } from "ckeditor5";
import {
    Autoformat,
    AutoLink,
    BlockQuote,
    Bold,
    ClassicEditor,
    Code,
    CodeBlock,
    Essentials,
    Heading,
    Italic,
    Link,
    List,
    Markdown as MarkdownPlugin,
    Paragraph,
    SourceEditing,
    Strikethrough,
    Table,
    TableToolbar,
    TextTransformation,
    TodoList,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import "github-markdown-css";
import i18n from "i18n";
import type { FC } from "react";
import { useCallback, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./md_editor.css";
import { useCKEditorStyles } from "./utils";

const plugins = [
    Essentials,
    Autoformat,
    AutoLink,
    BlockQuote,
    Bold,
    Code,
    CodeBlock,
    Heading,
    Italic,
    Link,
    List,
    MarkdownPlugin,
    Paragraph,
    SourceEditing,
    Strikethrough,
    Table,
    TableToolbar,
    TextTransformation,
    TodoList,
];

const toolbar = {
    items: [
        "undo",
        "redo",
        "|",
        "heading",
        "|",
        "bold",
        "italic",
        "strikethrough",
        "|",
        "blockQuote",
        "code",
        "link",
        "|",
        "bulletedList",
        "numberedList",
        "todoList",
        "|",
        "codeBlock",
        "insertTable",
        "|",
        {
            label: i18n.t("more"),
            icon: "threeVerticalDots",
            items: ["sourceEditing"],
        },
    ],
    shouldNotGroupWhenFull: false,
};

interface IMDEditorProps {
    value?: string;
    onChange?: (value: string) => unknown;
    placeholder?: string;
    readOnly?: boolean;
    autoHeight?: boolean;
    autoFocus?: boolean;
    defaultValue?: string;
    onBlur?: (value: string) => unknown;
}

const MDEditor: FC<IMDEditorProps> = ({
    value,
    onChange,
    placeholder,
    readOnly,
    autoHeight,
    autoFocus,
    defaultValue,
    onBlur,
}) => {
    const isControlled = typeof value !== "undefined";
    const hasDefaultValue = typeof defaultValue !== "undefined";

    const theme = useTheme();
    const editorStyles = useCKEditorStyles();
    const [innerValue, setInnerValue] = useState<string>(
        hasDefaultValue ? defaultValue : "",
    );
    const editorValue = isControlled ? value : innerValue;

    const handleChange = useCallback(
        (_: EventInfo, editor: ClassicEditor) => {
            const res = editor.getData();
            if (onChange) onChange(res);
            if (!isControlled) setInnerValue(res);
        },
        [isControlled, onChange],
    );

    const handleBlur = useCallback(
        (_: EventInfo, editor: ClassicEditor) => {
            if (onBlur) onBlur(editor.getData());
        },
        [onBlur],
    );

    return (
        <Box
            sx={{
                ...editorStyles,
                "& .ck-editor__editable": {
                    minHeight: autoHeight ? "auto" : "300px",
                },
                "& .ck-source-editing-area": {
                    minHeight: autoHeight ? "auto" : "300px",
                    "& textarea": {
                        color: theme.palette.text.primary,
                        backgroundColor: theme.palette.background.paper,
                    },
                },
                "& a": {
                    color: theme.palette.primary.main,
                    wordBreak: "break-word",
                },
            }}
        >
            <CKEditor
                editor={ClassicEditor}
                data={editorValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onReady={(editor: ClassicEditor) => {
                    editor.editing.view.change((writer: DowncastWriter) => {
                        const root = editor.editing.view.document.getRoot();
                        if (root)
                            writer.setStyle(
                                "height",
                                "calc(100% - 40px)",
                                root,
                            );
                    });
                    if (autoFocus) {
                        editor.editing.view.focus();
                    }
                    if (readOnly) {
                        editor.enableReadOnlyMode("");
                    }
                }}
                config={{
                    plugins,
                    toolbar,
                    placeholder,
                    table: {
                        contentToolbar: [
                            "tableColumn",
                            "tableRow",
                            "mergeTableCells",
                        ],
                    },
                }}
            />
        </Box>
    );
};

const MarkdownPreview: FC<{ text?: string | null }> = ({ text }) => {
    return (
        <Box
            sx={(theme) => ({
                "& .markdown-body": {
                    backgroundColor: "inherit",
                    color: theme.palette.text.primary,
                    wordBreak: "break-all",
                    "& a": {
                        color: theme.palette.primary.main,
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    },
                },
            })}
        >
            <Markdown
                className="markdown-body"
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer">
                            {props.children}
                        </a>
                    ),
                }}
            >
                {text}
            </Markdown>
        </Box>
    );
};

export { MarkdownPreview, MDEditor };
