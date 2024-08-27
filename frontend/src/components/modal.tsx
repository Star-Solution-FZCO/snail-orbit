import {
    Box,
    ModalProps,
    Modal as MuiModal,
    styled,
    SxProps,
    Theme,
} from "@mui/material";
import { forwardRef } from "react";

const ModalBox = styled(Box)(({ theme }) => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(4),
    boxShadow: theme.shadows[16],
    borderRadius: theme.shape.borderRadius,
    outline: "none",
}));

interface ProjectModalProps extends ModalProps {
    children: React.ReactElement<
        any,
        string | React.JSXElementConstructor<any>
    >;
    sx?: SxProps<Theme>;
    modalBoxSx?: SxProps<Theme>;
}

const Modal = forwardRef<HTMLDivElement, ProjectModalProps>(
    ({ children, sx, modalBoxSx, ...props }, ref) => {
        return (
            <MuiModal ref={ref} sx={sx} {...props}>
                <ModalBox sx={modalBoxSx}>{children}</ModalBox>
            </MuiModal>
        );
    },
);

export { Modal };
