import { CKEditor } from "@ckeditor/ckeditor5-react";
import { Box } from "@mui/material";
import type { EventInfo } from "ckeditor5";
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
import i18n from "shared/i18n";
import { IMDEditorProps } from "../types";
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
    shouldNotGroupWhenFull: true,
};

export const MDEditorV1: FC<IMDEditorProps> = ({
    value,
    defaultValue,
    onChange,
    onBlur,
    onFocus,
    placeholder,
    readOnly,
    autoHeight,
    autoFocus,
}) => {
    const hasDefaultValue = typeof defaultValue !== "undefined";

    const editorStyles = useCKEditorStyles();
    const [internalValue, setInternalValue] = useState<string>(
        hasDefaultValue ? defaultValue : "",
    );

    const isControlled = typeof value !== "undefined";
    const editorValue = isControlled ? value : internalValue;

    const handleChange = useCallback(
        (_: EventInfo, editor: ClassicEditor) => {
            const res = editor.getData();
            if (onChange) onChange(res);
            if (!isControlled) setInternalValue(res);
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
                        setInternalValue,
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
