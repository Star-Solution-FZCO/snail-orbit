import { InputBase, styled } from "@mui/material";

export const FieldInput = styled(InputBase)(({ theme }) => ({
    "& input": {
        borderRadius: 4,
        backgroundColor: theme.palette.mode === "light" ? "#fff" : "#0d1117",
        padding: 8,
        transition: theme.transitions.create(["border-color", "box-shadow"]),
        border: `1px solid ${theme.palette.mode === "light" ? "#eaecef" : "#30363d"}`,
        fontSize: 14,
        "&:focus": {
            boxShadow: `0px 0px 0px 3px ${
                theme.palette.mode === "light"
                    ? "rgba(3, 102, 214, 0.3)"
                    : "rgb(12, 45, 107)"
            }`,
            borderColor: theme.palette.mode === "light" ? "#0366d6" : "#388bfd",
        },
    },
}));
