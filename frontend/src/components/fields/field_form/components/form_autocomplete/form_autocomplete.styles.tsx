import { autocompleteClasses, InputBase, styled } from "@mui/material";

export const StyledAutocompletePopper = styled("div")(({ theme }) => ({
    [`& .${autocompleteClasses.paper}`]: {
        boxShadow: "none",
        margin: 0,
        color: "inherit",
        fontSize: 13,
    },
    [`& .${autocompleteClasses.listbox}`]: {
        backgroundColor: theme.palette.mode === "light" ? "#fff" : "#1c2128",
        padding: 0,
        [`& .${autocompleteClasses.option}`]: {
            minHeight: "auto",
            alignItems: "flex-start",
            padding: 8,
            borderBottom: `1px solid  ${
                theme.palette.mode === "light" ? " #eaecef" : "#30363d"
            }`,
            '&[aria-selected="true"]': {
                backgroundColor: "transparent",
            },
            [`&.${autocompleteClasses.focused}, &.${autocompleteClasses.focused}[aria-selected="true"]`]:
                {
                    backgroundColor: theme.palette.action.hover,
                },
        },
    },
    [`&.${autocompleteClasses.popperDisablePortal}`]: {
        position: "relative",
    },
}));

export const StyledInput = styled(InputBase)(({ theme }) => ({
    padding: 10,
    width: "100%",
    borderBottom: `1px solid ${
        theme.palette.mode === "light" ? "#eaecef" : "#30363d"
    }`,
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

export class PopperComponentProps {}

export function PopperComponent(props: PopperComponentProps) {
    // @ts-ignore
    const { disablePortal, anchorEl, open, ...other } = props;
    return <StyledAutocompletePopper {...other} />;
}
