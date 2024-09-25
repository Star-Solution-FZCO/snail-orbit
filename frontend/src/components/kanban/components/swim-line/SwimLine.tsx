import { forwardRef } from "react";
import { Handle } from "../handle/Handle";
import {
    HeaderStyled,
    StyledSwimLine,
    StyledSwimLineList,
} from "./SwimLine.styles";
import { SwimLineProps } from "./SwimLine.types";

export const SwimLine = forwardRef<HTMLDivElement, SwimLineProps>(
    (
        {
            children,
            handleProps,
            hover,
            label,
            placeholder,
            style,
            scrollable,
            shadow,
            hideHandle,
            ...props
        },
        ref,
    ) => {
        return (
            <StyledSwimLine
                {...props}
                style={{ ...style }}
                ref={ref}
                hover={hover}
                placeholder={placeholder}
                scrollable={scrollable}
                shadow={shadow}
            >
                <HeaderStyled
                    sx={{ display: hideHandle && !label ? "none" : "initial" }}
                >
                    {!hideHandle ? <Handle {...handleProps} /> : null}
                    {label ?? null}
                </HeaderStyled>
                {placeholder ? (
                    children
                ) : (
                    <StyledSwimLineList>{children}</StyledSwimLineList>
                )}
            </StyledSwimLine>
        );
    },
);
