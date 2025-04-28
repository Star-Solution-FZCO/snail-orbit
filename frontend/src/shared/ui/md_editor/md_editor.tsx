import { CKEditor } from "@ckeditor/ckeditor5-react";
import { Box } from "@mui/material";
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
    HorizontalLine,
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
import type { FC } from "react";
import { useCallback, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import i18n from "shared/i18n";
import "./md_editor.css";
import { syncSourceEditing, useCKEditorStyles } from "./utils";

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
    HorizontalLine,
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
        "horizontalLine",
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
    onFocus?: (value: string) => unknown;
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
    onFocus,
}) => {
    const isControlled = typeof value !== "undefined";
    const hasDefaultValue = typeof defaultValue !== "undefined";

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

    const handleFocus = useCallback(
        (_: EventInfo, editor: ClassicEditor) => {
            if (onFocus) onFocus(editor.getData());
        },
        [onFocus],
    );

    return (
        <Box
            sx={(theme) => ({
                ...editorStyles,
                "& .ck-editor__editable": {
                    minHeight: autoHeight ? "auto" : "300px",
                    wordBreak: "break-word",
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
                },
            })}
        >
            <CKEditor
                editor={ClassicEditor}
                data={editorValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
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

                    syncSourceEditing(
                        editor,
                        onChange,
                        isControlled,
                        setInnerValue,
                    );
                }}
                config={{
                    licenseKey: "GPL",
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
                    wordBreak: "break-word",
                },
            })}
        >
            <Markdown
                className="markdown-body"
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ node: _, ...props }) => {
                        const maxLength = 50;

                        const children =
                            typeof props.children === "string" &&
                            props.children.length > maxLength
                                ? props.children.slice(0, maxLength) + "..."
                                : props.children;

                        return (
                            <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {children}
                            </a>
                        );
                    },
                }}
            >
                {text}
            </Markdown>
        </Box>
    );
};

export { MarkdownPreview, MDEditor };
