import type { SxProps } from "@mui/material";
import { Stack, Typography } from "@mui/material";
import type { FC, HTMLAttributes, MouseEventHandler, ReactNode } from "react";
import { FieldCardWrapper } from "./field_card.styles";

export type FieldCardProps = {
    label: string;
    value: string;
    onClick?: MouseEventHandler<HTMLDivElement>;
    sx?: SxProps;
    orientation?: "horizontal" | "vertical";
    variant?: "standard" | "error";
    leftAdornment?: ReactNode;
    rightAdornment?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export const FieldCard: FC<FieldCardProps> = ({
    value,
    onClick,
    label,
    orientation = "horizontal",
    variant = "standard",
    rightAdornment,
    leftAdornment,
    ...rest
}) => {
    return (
        <FieldCardWrapper onClick={onClick} variant={variant} {...rest}>
            {leftAdornment}
            <Stack
                direction={orientation === "horizontal" ? "row" : "column"}
                alignItems="baseline"
            >
                <Typography
                    variant="body1"
                    component="span"
                    sx={{
                        width: 1,
                        color: "grey.500",
                        fontSize: orientation === "horizontal" ? 16 : 14,
                    }}
                >
                    {label}
                </Typography>

                <Typography
                    variant="body1"
                    component="span"
                    sx={{ width: 1, color: "primary.main" }}
                >
                    {value}
                </Typography>
            </Stack>
            {rightAdornment}
        </FieldCardWrapper>
    );
};

export default FieldCard;
