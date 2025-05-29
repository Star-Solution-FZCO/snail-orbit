import type { SxProps } from "@mui/material";
import type { ReactNode } from "react";

export type SwimLineProps = {
    children: ReactNode;
    label?: ReactNode;
    isClosed?: boolean;
    onClosedChange?: (value: boolean) => void;
    shadow?: boolean;
    sx?: SxProps;
};
