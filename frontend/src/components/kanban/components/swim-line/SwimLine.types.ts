import { SxProps } from "@mui/material";
import { CSSProperties, HTMLAttributes, ReactNode } from "react";

export type SwimLineProps = {
    children: ReactNode;
    label?: string;
    style?: CSSProperties;
    hover?: boolean;
    handleProps?: HTMLAttributes<any>;
    scrollable?: boolean;
    shadow?: boolean;
    placeholder?: boolean;
    sx?: SxProps;
};
