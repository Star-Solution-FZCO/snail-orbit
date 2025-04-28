import CloseIcon from "@mui/icons-material/Close";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Typography,
} from "@mui/material";
import { FC, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

interface IClipboardProps {
    open: boolean;
    value: string;
    onClose: () => void;
}

const Clipboard: FC<IClipboardProps> = ({ open, value, onClose }) => {
    const { t } = useTranslation();

    const inputRef = useRef<HTMLInputElement>(null);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(value);
        inputRef.current?.select();
        toast.success(t("clipboard.copied"));
    };

    return (
        <Dialog
            open={open}
            onClose={(_, reason) => {
                if (reason === "backdropClick" || reason === "escapeKeyDown") {
                    return;
                }
                onClose();
            }}
            fullWidth
        >
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <Typography fontWeight={500}>
                    {t("clipboard.copy.title")}
                </Typography>

                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <TextField
                    sx={{ mt: 1 }}
                    label={t("clipboard.copy.label")}
                    inputRef={inputRef}
                    value={value}
                    onClick={handleCopy}
                    slotProps={{
                        input: { readOnly: true },
                    }}
                    fullWidth
                />
            </DialogContent>

            <DialogActions>
                <Button onClick={handleCopy} variant="outlined" size="small">
                    {t("clipboard.copy")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { Clipboard };
