import { alpha, styled } from "@mui/material";
import { theme } from "../../../../../theme";

export const IssueRowRoot = styled("div", {
    name: "IssueRow",
    slot: "root",
})(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(0.5),
    fontSize: theme.typography.pxToRem(14),

    "&:focus": {
        outline: "none",
    },

    "&:hover, &:focus": {
        backgroundColor: alpha(theme.palette.background.paper, 0.5),
    },
}));

export const IssueRowHeader = styled("div", {
    name: "IssueRow",
    slot: "header",
})(() => ({
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: "24px",
}));

export const IssueRowBody = styled("div", { name: "IssueRow", slot: "body" })(
    () => ({
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "-webkit-box",
        "-webkit-line-clamp": "2",
        "-webkit-box-orient": "vertical",
    }),
);

export const IssueRowFieldsContainer = styled("div", {
    name: "IssueRow",
    slot: "fields",
})(() => ({
    display: "flex",
    flexDirection: "row",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
}));
