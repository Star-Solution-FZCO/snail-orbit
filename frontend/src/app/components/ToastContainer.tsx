import { styled } from "@mui/material";
import { Slide, ToastContainer } from "react-toastify";

const StyledContainer = styled(ToastContainer)(({ theme }) => ({
    ".Toastify__toast": {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
    },
}));

export const ToastContainerComp = () => {
    return (
        <StyledContainer
            position="bottom-right"
            transition={Slide}
            closeOnClick
            stacked
        />
    );
};
