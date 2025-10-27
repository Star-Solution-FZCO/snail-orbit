import type { EditorThemeClasses } from "lexical";

export const theme: EditorThemeClasses = {
    text: {
        bold: "editor-text-bold",
        italic: "editor-text-italic",
        underline: "editor-text-underline",
        strikethrough: "editor-text-strikethrough",
    },
    quote: "editor-quote",
    code: "editor-code",
    hr: "editor-hr",
    list: {
        listitem: "editor-listitem",
        listitemChecked: "editor-listitem-checked",
        listitemUnchecked: "editor-listitem-unchecked",
        nested: {
            listitem: "editor-nested-listitem",
        },
        olDepth: [
            "editor-list-ol1",
            "editor-list-ol2",
            "editor-list-ol3",
            "editor-list-ol4",
            "editor-list-ol5",
        ],
        ulDepth: [
            "editor-list-ul1",
            "editor-list-ul2",
            "editor-list-ul3",
            "editor-list-ul4",
            "editor-list-ul5",
        ],
    },
    table: "editor-table",
    tableCell: "editor-table-cell",
    tableCellHeader: "editor-table-cell-header",
};
