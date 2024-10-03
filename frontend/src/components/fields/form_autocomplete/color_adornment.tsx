import { Box, SxProps } from "@mui/material";
import { FC } from "react";

export type ColorAdornmentProps = {
    color: string;
    sx?: SxProps;
};

export const ColorAdornment: FC<ColorAdornmentProps> = ({ color, sx }) => {
    return (
        <Box
            component="span"
            sx={{
                width: 18,
                height: 18,
                flexShrink: 0,
                borderRadius: "3px",
                mr: 1,
                my: "auto",
                bgcolor: color,
                ...sx,
            }}
        />
    );
};
