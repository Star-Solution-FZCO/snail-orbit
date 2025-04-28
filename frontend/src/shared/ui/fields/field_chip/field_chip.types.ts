import { Box } from "@mui/material";
import { ComponentProps, ReactNode } from "react";

export type FieldChipProps = {
    leftAdornment?: ReactNode;
    rightAdornment?: ReactNode;
} & ComponentProps<typeof Box>;
