import { Link as MUILink, type LinkProps } from "@mui/material";
import { createLink } from "@tanstack/react-router";
import { forwardRef } from "react";

const Link = createLink(
    // eslint-disable-next-line react/display-name
    forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => (
        <MUILink {...props} ref={ref} />
    )),
);

export { Link };
