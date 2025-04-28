import { SxProps } from "@mui/material";
import { CSSProperties, HTMLAttributes, ReactNode } from "react";

export type ContainerProps = {
    children: ReactNode;
    columns?: number;
    label?: string;
    style?: CSSProperties;
    hover?: boolean;
    handleProps?: HTMLAttributes<any>;
    hideHandle?: boolean;
    scrollable?: boolean;
    shadow?: boolean;
    placeholder?: boolean;
    sx?: SxProps;
};
