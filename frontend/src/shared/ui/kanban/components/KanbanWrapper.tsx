import type { StyledComponent } from "@emotion/styled";
import type { BoxProps } from "@mui/material";
import { Box, styled } from "@mui/material";

export const KanbanWrapper: StyledComponent<BoxProps> = styled(Box)(
    ({ theme }) => ({
        maxHeight: "calc(100dvh - 202px)",
        overflow: "auto",
        scrollbarGutter: "stable",
        backgroundColor: theme.palette.background.board,
        borderBottom: `1px solid ${theme.palette.grey["700"]}`,
        outline: "none",
    }),
);
