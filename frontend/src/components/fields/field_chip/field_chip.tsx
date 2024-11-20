import { FC, memo } from "react";
import { FieldChipBoxStyled, FieldChipStyled } from "./field_chip.styles";
import { FieldChipProps } from "./field_chip.types";

export const FieldChip: FC<FieldChipProps> = memo(
    ({ children, onClick, boxColor }) => {
        return (
            <FieldChipStyled
                onClick={onClick}
                sx={{ cursor: onClick ? "pointer" : "default" }}
            >
                {boxColor ? (
                    <FieldChipBoxStyled style={{ backgroundColor: boxColor }} />
                ) : null}
                {children}
            </FieldChipStyled>
        );
    },
);
