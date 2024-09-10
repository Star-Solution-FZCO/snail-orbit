import { CSSProperties, forwardRef } from "react";
import { Handle } from "../handle/Handle";
import { HeaderStyled, StyledContainer } from "./container.styles";
import { ContainerProps } from "./container.types";

// TODO: Add sx support
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
    (
        {
            children,
            columns = 1,
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
            <StyledContainer
                {...props}
                ref={ref}
                style={
                    {
                        ...style,
                        "--columns": columns,
                    } as CSSProperties
                }
                hover={hover}
                placeholder={placeholder}
                scrollable={scrollable}
                shadow={shadow}
            >
                <HeaderStyled>
                    <Handle {...handleProps} />
                    {label ?? null}
                </HeaderStyled>
                {placeholder ? children : <ul>{children}</ul>}
            </StyledContainer>
        );
    },
);
