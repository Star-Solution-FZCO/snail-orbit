import { Box } from "@mui/material";
import type { FC } from "react";
import { forwardRef, memo } from "react";
import { FieldChipStyled } from "./field_chip.styles";
import type { FieldChipProps } from "./field_chip.types";

export const FieldChip: FC<FieldChipProps> = memo(
    forwardRef(
        (
            { children, onClick, sx, leftAdornment, rightAdornment, ...props },
            ref,
        ) => {
            return (
                <FieldChipStyled
                    onClick={onClick}
                    {...props}
                    sx={{ cursor: onClick ? "pointer" : "default", ...sx }}
                    ref={ref}
                >
                    {leftAdornment}
                    <Box
                        component="span"
                        sx={{ textOverflow: "ellipsis", overflow: "hidden" }}
                    >
                        {children}
                    </Box>
                    {rightAdornment}
                </FieldChipStyled>
            );
        },
    ),
);
