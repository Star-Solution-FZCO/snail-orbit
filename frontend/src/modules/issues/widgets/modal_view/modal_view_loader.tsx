import { CircularProgress, Dialog, DialogContent } from "@mui/material";
import type { FC } from "react";

type ModalViewLoaderProps = {
    open: boolean;
    onClose?: () => void;
};

export const ModalViewLoader: FC<ModalViewLoaderProps> = ({
    onClose,
    open,
}) => (
    <Dialog open={open} onClose={onClose}>
        <DialogContent>
            <CircularProgress />
        </DialogContent>
    </Dialog>
);
