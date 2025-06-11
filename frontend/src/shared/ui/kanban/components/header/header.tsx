import type { FC } from "react";
import { ChevronButton } from "../ChevronButton";
import { HeaderStyled } from "./header.styles";
import type { HeaderProps } from "./header.types";

export const Header: FC<HeaderProps> = ({
    isClosed,
    onClosedChange,
    label,
}) => (
    <HeaderStyled isClosed={isClosed}>
        {isClosed !== undefined && (
            <ChevronButton
                open={isClosed}
                onClick={() => onClosedChange?.(!isClosed)}
            />
        )}{" "}
        {label}
    </HeaderStyled>
);
