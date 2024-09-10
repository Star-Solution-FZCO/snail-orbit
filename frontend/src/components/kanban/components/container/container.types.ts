import { CSSProperties, HTMLAttributes, ReactNode } from "react";

export type ContainerProps = {
    children: ReactNode;
    columns?: number;
    label?: string;
    style?: CSSProperties;
    hover?: boolean;
    handleProps?: HTMLAttributes<any>;
    scrollable?: boolean;
    shadow?: boolean;
    placeholder?: boolean;
};
