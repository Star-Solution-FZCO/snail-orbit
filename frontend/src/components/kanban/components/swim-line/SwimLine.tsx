import { forwardRef } from "react";
import { HeaderStyled } from "../container/container.styles";
import { Handle } from "../handle/Handle";
import { StyledSwimLine, StyledSwimLineList } from "./SwimLine.styles";
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
                <HeaderStyled>
                    <Handle {...handleProps} />
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
