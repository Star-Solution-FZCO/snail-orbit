import { styled } from "@mui/material";

export const FieldChipStyled = styled("div", { label: "FieldChip" })(
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

        "&:hover": {
            color: theme.palette.primary.main,
        },
    }),
);

export const FieldChipBoxStyled = styled("div")(({ theme }) => ({
    width: theme.typography.pxToRem(20),
    height: theme.typography.pxToRem(20),
    borderRadius: 3,
}));
