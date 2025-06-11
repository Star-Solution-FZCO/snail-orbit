import { ChevronRight } from "@mui/icons-material";
import { IconButton, styled } from "@mui/material";

type ChevronButtonProps = {
    open?: boolean;
    onClick?: () => void;
};

export const ChevronButton = (props: ChevronButtonProps) => {
    const { open, onClick } = props;

    return (
        <IconButton size="small" sx={{ p: 0 }} onClick={onClick}>
            <ChevronRightStyled open={!!open} />
        </IconButton>
    );
};

const ChevronRightStyled = styled(ChevronRight)<{ open: boolean }>(
    ({ open, theme }) => ({
        fontSize: "inherit",
        transition: theme.transitions.create("transform", {
            delay: 0,
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.short,
        }),
        transform: !open ? "rotate(90deg)" : "rotate(0)",
    }),
);
