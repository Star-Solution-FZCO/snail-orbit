import type { FC } from "react";
import { ChevronButton } from "../ChevronButton";
import {
    HeaderStyled,
    StyledSwimLine,
    StyledSwimLineList,
} from "./SwimLine.styles";
import type { SwimLineProps } from "./SwimLine.types";

export const SwimLine: FC<SwimLineProps> = ({
    children,
    label,
    shadow,
    isClosed,
    onClosedChange,
    ...props
}) => {
    return (
        <StyledSwimLine {...props} shadow={shadow}>
            <HeaderStyled sx={{ display: !label ? "none" : "initial" }}>
                {isClosed !== undefined && (
                    <ChevronButton
                        open={isClosed}
                        onClick={() => onClosedChange?.(!isClosed)}
                    />
                )}{" "}
                {label ?? null}
            </HeaderStyled>
            {isClosed === undefined || !isClosed ? (
                <StyledSwimLineList>{children}</StyledSwimLineList>
            ) : null}
        </StyledSwimLine>
    );
};
