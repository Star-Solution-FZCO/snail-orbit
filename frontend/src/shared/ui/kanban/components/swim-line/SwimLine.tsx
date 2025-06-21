import { Typography } from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
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
    issueCount,
    ...props
}) => {
    const { t } = useTranslation();

    return (
        <StyledSwimLine {...props} shadow={shadow}>
            <HeaderStyled sx={!label ? { display: "none" } : undefined}>
                <span>
                    {isClosed !== undefined && (
                        <ChevronButton
                            open={isClosed}
                            onClick={() => onClosedChange?.(!isClosed)}
                        />
                    )}{" "}
                    {label ?? null}
                </span>
                {issueCount !== undefined ? (
                    <Typography component="span" variant="caption">
                        {`${t("Issues")} ${issueCount}`}
                    </Typography>
                ) : null}
            </HeaderStyled>
            {isClosed === undefined || !isClosed ? (
                <StyledSwimLineList>{children}</StyledSwimLineList>
            ) : null}
        </StyledSwimLine>
    );
};
