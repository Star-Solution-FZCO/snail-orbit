import { CSSProperties, forwardRef } from "react";
import { HeaderStyled, StyledContainer } from "./container.styles";
import { ContainerProps } from "./container.types";

// TODO: Add sx support
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
    (
        {
            children,
            columns = 1,
            handleProps,
            horizontal,
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
                horizontal={horizontal}
                hover={hover}
                placeholder={placeholder}
                scrollable={scrollable}
                shadow={shadow}
            >
                {label ? <HeaderStyled>{label}</HeaderStyled> : null}
                {placeholder ? children : <ul>{children}</ul>}
            </StyledContainer>
        );
    },
);
