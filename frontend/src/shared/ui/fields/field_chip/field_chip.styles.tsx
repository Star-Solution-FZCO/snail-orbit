import { Box, styled } from "@mui/material";

export const FieldChipStyled = styled(Box, { label: "FieldChip" })(
    ({ theme }) => ({
        fontSize: theme.typography.pxToRem(12),
        color: theme.palette.text.secondary,
        cursor: "default",
        display: "flex",
        flexDirection: "row",
        gap: theme.spacing(0.75),
        alignItems: "center",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",

        "&:hover": {
            color: theme.palette.primary.main,
        },
    }),
);
