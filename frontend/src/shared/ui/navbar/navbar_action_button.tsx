import type { ButtonProps } from "@mui/material";
import { Button } from "@mui/material";
import type { FC } from "react";

type NavbarActionButtonProps = ButtonProps;

export const NavbarActionButton: FC<NavbarActionButtonProps> = ({
    sx,
    ...props
}) => {
    return (
        <Button
            sx={{ height: "24px", py: 0, textTransform: "none", ...sx }}
            variant="contained"
            size="small"
            {...props}
        />
    );
};
