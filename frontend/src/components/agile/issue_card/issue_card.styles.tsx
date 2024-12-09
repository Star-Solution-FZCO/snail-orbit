import { Box, styled } from "@mui/material";

export const IssueCardStyled = styled(Box, {
    name: "IssueCard",
    slot: "root",
})<{
    colors?: string[];
}>(({ theme, colors }) => ({
    fontSize: theme.typography.pxToRem(14),
    display: "flex",
    flexDirection: "row",
    justifyContent: "stretch",
    position: "relative",
    borderRadius: "inherit",
    paddingLeft: colors && colors.length ? theme.spacing(0.75) : 0,

    "&:after":
        colors && colors.length
            ? {
                  background: "var(--colors)",
                  position: "absolute",
                  content: '""',
                  width: theme.spacing(0.75),
                  borderTopLeftRadius: "inherit",
                  borderBottomLeftRadius: "inherit",
                  left: 0,
                  top: 0,
                  bottom: 0,
              }
            : undefined,
}));

export const IssueCardBody = styled(Box, { name: "IssueCard", slot: "body" })(
    ({ theme }) => ({
        padding: theme.spacing(1),
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1),
        justifyContent: "space-between",
        flexGrow: 1,
    }),
);

export const IssueCardHeader = styled(Box, {
    name: "IssueCard",
    slot: "header",
})(({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    gap: theme.spacing(1),
}));

export const IssueCardBottom = styled(Box, {
    name: "IssueCard",
    slot: "bottom",
})(({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    gap: theme.spacing(1),
    flexWrap: "wrap",
}));
