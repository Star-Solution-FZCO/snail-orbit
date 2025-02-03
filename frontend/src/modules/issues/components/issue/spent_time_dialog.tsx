import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
} from "@mui/material";
import { SpentTimeField } from "components";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatSpentTime } from "utils";

interface ISpentTimeDialogProps {
    open: boolean;
    initialSpentTime?: number;
    onClose: () => void;
    onSubmit: (spentTime: number) => void;
    mode: "add" | "edit";
    loading?: boolean;
}

const SpentTimeDialog: FC<ISpentTimeDialogProps> = ({
    open,
    initialSpentTime,
    onClose,
    onSubmit,
    mode,
    loading,
}) => {
    const { t } = useTranslation();

    const [spentTime, setSpentTime] = useState(0);

    const handleClickSave = () => {
        onSubmit(spentTime);
    };

    useEffect(() => {
        if (initialSpentTime) {
            setSpentTime(initialSpentTime);
        }
    }, [initialSpentTime]);

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                }}
            >
                {t(
                    mode === "add"
                        ? "issues.spentTime.add"
                        : "issues.spentTime.edit",
                )}

                <IconButton onClick={onClose} size="small" disabled={loading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Box mt={1} minHeight="85px">
                    <SpentTimeField
                        label={t("issues.spentTime")}
                        initialValue={
                            spentTime ? formatSpentTime(spentTime) : undefined
                        }
                        onChange={setSpentTime}
                    />
                </Box>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    disabled={loading}
                >
                    {t("cancel")}
                </Button>

                <LoadingButton
                    onClick={handleClickSave}
                    variant="outlined"
                    loading={loading}
                    disabled={spentTime === 0}
                >
                    {t("save")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export { SpentTimeDialog };
