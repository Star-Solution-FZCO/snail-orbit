import { useTheme } from "@mui/material";

export const useEditorStyles = () => {
    const theme = useTheme();

    return {
        // Editor layout
        ".content_editable__root": {
            color: theme.palette.text.primary,
            display: "block",
            position: "relative",
            outline: 0,
            padding: `0 ${theme.spacing(1.2)}`,
            paddingBottom: theme.spacing(1.2),
            minHeight: theme.spacing(37.5), // 300px
            "& p": {
                margin: `${theme.spacing(1.8)} 0`,
            },
        },

        ".content_editable__root.autoheight": {
            minHeight: "auto",
        },

        ".content_editable__placeholder": {
            position: "absolute",
            top: theme.spacing(1.8),
            left: theme.spacing(1.2),
            color: theme.palette.text.disabled,
        },

        ".editor-scroller": {
            maxWidth: "100%",
            border: 0,
            display: "flex",
            position: "relative",
            outline: 0,
            zIndex: 0,
            resize: "vertical",
        },

        ".editor": {
            flex: "auto",
            maxWidth: "100%",
            position: "relative",
            resize: "vertical",
            zIndex: -1,
        },

        // Text formatting
        ".editor-text-bold": {
            fontWeight: "bold",
        },
        ".editor-text-italic": {
            fontStyle: "italic",
        },
        ".editor-text-underline": {
            textDecoration: "underline",
        },
        ".editor-text-strikethrough": {
            textDecoration: "line-through",
        },

        // Blockquote
        ".editor-quote": {
            margin: theme.spacing(1, 0),
            paddingLeft: theme.spacing(2),
            borderLeftWidth: 4,
            borderLeftStyle: "solid",
            borderLeftColor: theme.palette.divider,
            color: theme.palette.text.secondary,
        },

        "& a": {
            cursor: "pointer",
            color: theme.palette.primary.main,
            textDecoration: "underline",
        },

        // Mentions
        ".editor-mention": {
            color: theme.palette.primary.main,
            cursor: "pointer",
            fontWeight: 500,
        },

        // Code block
        ".editor-code": {
            display: "block",
            whiteSpace: "pre-wrap",
            backgroundColor: theme.palette.action.hover,
            margin: 0,
            padding: theme.spacing(2),
            borderRadius: theme.spacing(0.5),
            fontFamily:
                "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
        },

        // Horizontal rule
        ".editor-hr": {
            height: 4,
            backgroundColor: theme.palette.divider,
            border: "none",
            padding: theme.spacing(0.25),
            margin: theme.spacing(1, 0),
        },

        // Lists
        "& ul, ol": {
            marginTop: theme.spacing(0),
            marginBottom: theme.spacing(2),
        },

        // Unordered lists
        ".editor-list-ul1": {
            paddingLeft: 0,
            listStylePosition: "inside",
        },
        ".editor-list-ul2": {
            paddingLeft: theme.spacing(2.5),
            listStylePosition: "inside",
        },
        ".editor-list-ul3": {
            paddingLeft: theme.spacing(5),
            listStylePosition: "inside",
        },
        ".editor-list-ul4": {
            paddingLeft: theme.spacing(7.5),
            listStylePosition: "inside",
        },
        ".editor-list-ul5": {
            paddingLeft: theme.spacing(10),
            listStylePosition: "inside",
        },

        // Ordered lists
        ".editor-list-ol1": {
            paddingLeft: 0,
            listStylePosition: "inside",
        },
        ".editor-list-ol2": {
            paddingLeft: theme.spacing(2.5),
            listStylePosition: "inside",
        },
        ".editor-list-ol3": {
            paddingLeft: theme.spacing(5),
            listStylePosition: "inside",
        },
        ".editor-list-ol4": {
            paddingLeft: theme.spacing(7.5),
            listStylePosition: "inside",
        },
        ".editor-list-ol5": {
            paddingLeft: theme.spacing(10),
            listStylePosition: "inside",
        },

        // Nested list items
        ".editor-nested-listitem": {
            listStyleType: "none",
        },

        // Checklist
        ".editor-listitem-checked, .editor-listitem-unchecked": {
            position: "relative",
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(1),
            paddingLeft: theme.spacing(3),
            listStyle: "none",
            outline: 0,
        },

        ".editor-listitem-checked:before, .editor-listitem-unchecked:before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: theme.spacing(0.25),
            width: theme.spacing(2),
            height: theme.spacing(2),
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.spacing(0.25),
        },

        ".editor-listitem-checked:before": {
            backgroundColor: theme.palette.success.main,
            borderColor: theme.palette.success.main,
        },

        ".editor-listitem-checked:after": {
            content: '"✓"',
            position: "absolute",
            left: theme.spacing(0.375),
            top: 0,
            color: theme.palette.common.white,
            fontSize: "12px",
            fontWeight: "bold",
        },

        // Tables
        ".editor-table": {
            borderCollapse: "collapse",
            borderSpacing: 0,
            minWidth: 200,
            maxWidth: "100%",
            overflowY: "scroll",
            margin: theme.spacing(2, 0),
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
            "& tr": {
                borderBottom: `1px solid ${theme.palette.divider}`,
                "&:last-child": {
                    borderBottom: "none",
                },
            },
        },

        ".editor-table-cell": {
            border: `1px solid ${theme.palette.divider}`,
            padding: theme.spacing(1, 1.5),
            minWidth: theme.spacing(12),
            verticalAlign: "top",
            textAlign: "left",
            position: "relative",
            outline: 0,
            backgroundColor: theme.palette.background.paper,
            "&:focus": {
                backgroundColor: theme.palette.action.hover,
            },
            "& p": {
                margin: 0,
            },
        },

        ".editor-table-cell-header": {
            backgroundColor: theme.palette.grey[50],
            fontWeight: "bold",
            textAlign: "left",
            borderBottom: `2px solid ${theme.palette.divider}`,
            ...(theme.palette.mode === "dark" && {
                backgroundColor: theme.palette.grey[800],
            }),
        },
    };
};
