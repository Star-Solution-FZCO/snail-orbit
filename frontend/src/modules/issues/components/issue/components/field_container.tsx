import type { StyledComponent } from "@emotion/styled";
import type { BoxProps } from "@mui/material";
import { Box, styled } from "@mui/material";

export const FieldContainer: StyledComponent<BoxProps> = styled(Box)(
    ({ theme }) => ({
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        width: "300px",
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: theme.palette.primary.main,
        borderRadius: theme.spacing(0.5),
        backgroundColor: theme.palette.background.paper,
        position: "sticky",
        top: "36px",
    }),
);
