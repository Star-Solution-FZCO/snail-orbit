import { CKEditor } from "@ckeditor/ckeditor5-react";
import { Box, useTheme } from "@mui/material";
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
import { FC } from "react";
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
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    autoHeight?: boolean;
    autoFocus?: boolean;
}

const MDEditor: FC<IMDEditorProps> = ({
    value,
    onChange,
    placeholder,
    readOnly,
    autoHeight,
    autoFocus,
}) => {
    const theme = useTheme();
    const editorStyles = useCKEditorStyles();

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
                data={value}
                onChange={(_, editor) => {
                    onChange(editor.getData());
                }}
                onReady={(editor: any) => {
                    editor.editing.view.change((writer: any) => {
                        writer.setStyle(
                            "height",
                            "calc(100% - 40px)",
                            editor.editing.view.document.getRoot(),
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
