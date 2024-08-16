import { SxProps } from "@mui/material";
import { FC } from "react";

export type FieldCardProps = {
    label: string;
    value: string;
    onClick?: () => unknown;
    sx?: SxProps;
    orientation?: "horizontal" | "vertical";
};

export const FieldCard: FC<FieldCardProps> = ({
    value,
    onClick,
    label,
    orientation = "horizontal",
}) => {
    return <div>Test</div>;
};

export default FieldCard;
