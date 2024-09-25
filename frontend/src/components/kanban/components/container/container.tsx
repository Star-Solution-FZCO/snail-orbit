import { CSSProperties, forwardRef } from "react";
import { Handle } from "../handle/Handle";
import {
    HeaderStyled,
    StyledContainer,
    StyledContainerList,
} from "./container.styles";
import { ContainerProps } from "./container.types";

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
            hideHandle,
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
                <HeaderStyled
                    sx={{ display: hideHandle && !label ? "none" : "initial" }}
                >
                    {!hideHandle ? <Handle {...handleProps} /> : null}
                    {label ?? null}
                </HeaderStyled>
                {placeholder ? (
                    children
                ) : (
                    <StyledContainerList>{children}</StyledContainerList>
                )}
            </StyledContainer>
        );
    },
);
