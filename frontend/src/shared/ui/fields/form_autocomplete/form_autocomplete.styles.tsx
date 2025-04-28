import { autocompleteClasses, styled } from "@mui/material";
import { FieldInput } from "../field_input/field_input";

export const StyledAutocompletePopper = styled("div")(({ theme }) => ({
    [`& .${autocompleteClasses.paper}`]: {
        boxShadow: "none",
        margin: 0,
        color: "inherit",
        fontSize: 13,
    },
    [`& .${autocompleteClasses.listbox}`]: {
        backgroundColor: theme.palette.background.board,
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

export const StyledInput = styled(FieldInput)(({ theme }) => ({
    padding: 10,
    width: "100%",
    borderBottom: `1px solid ${
        theme.palette.mode === "light" ? "#eaecef" : "#30363d"
    }`,
}));

export const BottomSlot = styled("div")(({ theme }) => ({
    width: "100%",
    borderTop: `1px solid ${
        theme.palette.mode === "light" ? "#eaecef" : "#30363d"
    }`,
    backgroundColor: theme.palette.background.board,
}));

export class PopperComponentProps {}

export function PopperComponent(props: PopperComponentProps) {
    // @ts-expect-error trash unused fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { disablePortal, anchorEl, open, ...other } = props;
    return <StyledAutocompletePopper {...other} />;
}
