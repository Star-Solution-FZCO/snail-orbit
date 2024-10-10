import { CKEditor } from "@ckeditor/ckeditor5-react";
import { Box, useTheme } from "@mui/material";
import MDEditorLib from "@uiw/react-md-editor";
import {
    Autoformat,
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
    Markdown,
    Paragraph,
    SourceEditing,
    Strikethrough,
    Table,
    TableToolbar,
    TextTransformation,
    TodoList,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import { ComponentProps, FC } from "react";
import "./md_editor.css";
import { useCKEditorStyles } from "./utils";

type IMDEditorProps = ComponentProps<typeof MDEditorLib>;

const MDEditor: FC<IMDEditorProps> = (props) => {
    const theme = useTheme();

    return (
        <Box data-color-mode={theme.palette.mode} width="100%" height="100%">
            <Box className="wmde-markdown-var" />

            <MDEditorLib {...props} />
        </Box>
    );
};

const plugins = [
    Essentials,
    Autoformat,
    BlockQuote,
    Bold,
    Code,
    CodeBlock,
    Heading,
    Italic,
    Link,
    List,
    Markdown,
    Paragraph,
    SourceEditing,
    Strikethrough,
    Table,
    TableToolbar,
    TextTransformation,
    TodoList,
];

const toolbar = [
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
    "sourceEditing",
];

interface ICKMDEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    autoHeight?: boolean;
}

const CKMDEditor: FC<ICKMDEditorProps> = ({
    value,
    onChange,
    placeholder,
    readOnly,
    autoHeight,
}) => {
    const editorStyles = useCKEditorStyles();

    return (
        <Box
            sx={{
                ...editorStyles,
                "& .ck-editor__editable": {
                    minHeight: autoHeight ? "auto" : "300px",
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
                    if (readOnly) {
                        editor.enableReadOnlyMode("");
                    }
                }}
                config={{
                    plugins,
                    toolbar,
                    placeholder,
                    table: {
                        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
                    },
                }}
            />
        </Box>
    );
};

export { CKMDEditor, MDEditor };
