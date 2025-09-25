import CloseIcon from "@mui/icons-material/Close";
import WarningIcon from "@mui/icons-material/Warning";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

interface FieldEditWarningDialogProps {
    open: boolean;
    onConfirm: () => void;
    onClose: () => void;
    projectCount: number;
}

export const FieldEditWarningDialog: FC<FieldEditWarningDialogProps> = ({
    open,
    onConfirm,
    onClose,
    projectCount,
}) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Typography
                        variant="h6"
                        display="flex"
                        alignItems="center"
                        gap={1}
                    >
                        <WarningIcon color="warning" />

                        {t("customFields.editWarning.title")}
                    </Typography>

                    <IconButton>
                        <CloseIcon onClick={onClose} />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent>
                <Typography>
                    {t("customFields.editWarning.message", {
                        count: projectCount,
                    })}
                </Typography>

                <Typography mt={2} color="text.secondary">
                    {t("customFields.editWarning.consequence")}
                </Typography>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    size="small"
                    color="error"
                >
                    {t("cancel")}
                </Button>

                <Button onClick={onConfirm} variant="outlined" size="small">
                    {t("customFields.editWarning.proceed")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
