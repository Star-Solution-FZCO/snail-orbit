import type { StyledComponent } from "@emotion/styled";
import { Link, styled } from "@mui/material";
import { createLink } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { forwardRef } from "react";

export type IssueLinkComponentProps = {
    variant?: "default" | "silent";
    lineThrough?: boolean;
    resolved?: boolean;
} & Omit<ComponentProps<typeof Link>, "variant">;

// @ts-expect-error Type mismatch meh
const IssueLinkComp: StyledComponent<IssueLinkComponentProps> = styled(Link, {
    name: "IssueLink",
    shouldForwardProp: (name) =>
        !["lineThrough", "resolved", "variant"].includes(name.toString()),
})<IssueLinkComponentProps>(({ theme, variant, lineThrough, resolved }) => ({
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

const IssueLinkComponent = createLink(
    forwardRef<HTMLAnchorElement, IssueLinkComponentProps>((props, ref) => (
        <IssueLinkComp {...props} ref={ref} />
    )),
);

export { IssueLinkComponent };
