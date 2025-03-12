import type { StyledComponent } from "@emotion/styled";
import { styled } from "@mui/material";
import type { ComponentProps } from "react";
import { Link } from "./link";

type IssueLinkProps = {
    variant?: "default" | "silent";
    lineThrough?: boolean;
    resolved?: boolean;
} & Omit<ComponentProps<typeof Link>, "variant">;

// @ts-expect-error Complex problem with ESM modules
export const IssueLink: StyledComponent<IssueLinkProps> = styled(Link, {
    name: "IssueLink",
})<IssueLinkProps>(({ theme, variant, lineThrough, resolved }) => ({
    color: resolved
        ? theme.palette.text.disabled
        : variant === "silent"
          ? theme.palette.text.primary
          : theme.palette.primary.main,

    textDecoration: lineThrough ? "line-through" : "none",

    "&:hover": {
        color: theme.palette.primary.main,
        textDecoration: lineThrough ? "line-through underline" : "underline",
    },
}));
