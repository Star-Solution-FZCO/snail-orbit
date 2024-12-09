import type { StyledComponent } from "@emotion/styled";
import { styled } from "@mui/material";
import type { ComponentProps } from "react";
import { Link } from "./link";

export const IssueLink: StyledComponent<ComponentProps<typeof Link>> = styled(
    Link,
    { name: "IssueLink" },
)(({ theme }) => ({
    color: theme.palette.primary.main,
    textDecoration: "none",

    "&:hover": {
        color: theme.palette.primary.dark,
    },
}));
