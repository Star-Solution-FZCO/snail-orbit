import { Box, styled } from "@mui/material";

export const MarkdownWrapper = styled(Box)(({ theme }) => ({
    backgroundColor: "inherit",
    color: theme.palette.text.primary,
    wordBreak: "break-word",
    fontSize: "0.875rem",
    "& p, h1, h2, h3": {
        marginTop: 0,
        marginBottom: theme.spacing(1.8),
    },
    "& pre": {
        whiteSpace: "pre-wrap",
        backgroundColor: theme.palette.action.hover,
        margin: 0,
        padding: theme.spacing(2),
        borderRadius: theme.spacing(0.5),
        fontFamily:
            "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
    },
    "& blockquote": {
        margin: 0,
        paddingLeft: theme.spacing(2),
        borderLeftWidth: theme.spacing(0.5),
        borderLeftStyle: "solid",
        borderLeftColor: theme.palette.divider,
        color: theme.palette.text.secondary,
    },
    "& hr": {
        height: 4,
        backgroundColor: theme.palette.divider,
        border: "none",
        padding: theme.spacing(0.25),
        margin: theme.spacing(1, 0),
    },
    "& ul, ol": {
        paddingLeft: theme.spacing(2),
        marginTop: theme.spacing(0),
        marginBottom: theme.spacing(2),
    },
    "& ul.contains-task-list": {
        paddingLeft: 0,
    },
    "& li.task-list-item": {
        position: "relative",
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        paddingLeft: theme.spacing(3),
        listStyle: "none",
        outline: 0,
    },
    "& li.task-list-item input[type='checkbox']": {
        position: "absolute",
        left: 0,
        top: theme.spacing(0.25),
        width: theme.spacing(2),
        height: theme.spacing(2),
        margin: 0,
        appearance: "none",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.spacing(0.25),
        cursor: "pointer",
        "&:checked": {
            backgroundColor: theme.palette.success.main,
            borderColor: theme.palette.success.main,
            "&::after": {
                content: '"✓"',
                position: "absolute",
                left: 2,
                top: 0,
                color: theme.palette.common.white,
                fontSize: "12px",
                fontWeight: "bold",
            },
        },
    },
    "& table": {
        borderCollapse: "collapse",
        borderSpacing: 0,
        maxWidth: "100%",
        minWidth: 200,
        margin: theme.spacing(2, 0),
        border: `1px solid ${theme.palette.divider}`,
        overflow: "hidden",
    },
    "& thead": {
        backgroundColor: theme.palette.grey[50],
        ...(theme.palette.mode === "dark" && {
            backgroundColor: theme.palette.grey[800],
        }),
    },
    "& th": {
        border: `1px solid ${theme.palette.divider}`,
        padding: theme.spacing(1, 1.5),
        fontWeight: "bold",
        textAlign: "left",
        borderBottom: `2px solid ${theme.palette.divider}`,
    },
    "& td": {
        border: `1px solid ${theme.palette.divider}`,
        padding: theme.spacing(1, 1.5),
        textAlign: "left",
        verticalAlign: "top",
    },
    "& tr": {
        borderBottom: `1px solid ${theme.palette.divider}`,
        "&:last-child": {
            borderBottom: "none",
        },
        "&:nth-of-type(even)": {
            backgroundColor: theme.palette.action.hover,
        },
    },
}));
