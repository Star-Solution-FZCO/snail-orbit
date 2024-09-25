import { FC } from "react";
import { HeaderStyled, HeaderStyledContainer } from "./header.styles";
import { HeaderProps } from "./header.types";

export const Header: FC<HeaderProps> = ({ columns }) => {
    return (
        <HeaderStyledContainer>
            {columns.map(({ label, id }) => (
                <HeaderStyled key={id}>{label}</HeaderStyled>
            ))}
        </HeaderStyledContainer>
    );
};
