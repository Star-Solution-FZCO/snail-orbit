import { Stack, SxProps, Typography } from "@mui/material";
import { FC, MouseEventHandler, ReactNode } from "react";
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
};

export const FieldCard: FC<FieldCardProps> = ({
    value,
    onClick,
    label,
    orientation = "horizontal",
    variant = "standard",
    rightAdornment,
    leftAdornment,
}) => {
    return (
        <FieldCardWrapper onClick={onClick} variant={variant}>
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
