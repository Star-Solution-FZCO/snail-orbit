import type { SxProps } from "@mui/material";
import type { ReactNode } from "react";

export type ContainerProps = {
    children: ReactNode;
    columns?: number;
    columnIndex: number;
    swimLaneIndex: number;
    sx?: SxProps;
    isClosed?: boolean;
};
