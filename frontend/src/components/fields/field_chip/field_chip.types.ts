import { PropsWithChildren } from "react";

export type FieldChipProps = {
    onClick?: () => void;
    boxColor?: string;
} & PropsWithChildren;
