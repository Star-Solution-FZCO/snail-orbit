import { Link as MUILink, type LinkProps } from "@mui/material";
import { createLink } from "@tanstack/react-router";
import { forwardRef } from "react";

const Link = createLink(
    forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => (
        <MUILink underline="none" {...props} ref={ref} />
    )),
);

export { Link };
