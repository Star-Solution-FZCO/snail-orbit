import { Chip } from "@mui/material";
import type { FC } from "react";
import { ChevronButton } from "../ChevronButton";
import { HeaderStyled } from "./header.styles";
import type { HeaderProps } from "./header.types";

export const Header: FC<HeaderProps> = ({
    isClosed,
    onClosedChange,
    label,
    issueCount,
}) => (
    <HeaderStyled isClosed={isClosed}>
        <span>
            {isClosed !== undefined && (
                <ChevronButton
                    open={isClosed}
                    onClick={() => onClosedChange?.(!isClosed)}
                />
            )}{" "}
            {label}
        </span>
        {issueCount !== undefined && !isClosed ? (
            <Chip
                size="small"
                sx={{ fontSize: 12, padding: 1 }}
                label={issueCount}
            />
        ) : null}
    </HeaderStyled>
);
