import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Popover,
    TextField,
} from "@mui/material";
import ColorPicker from "@uiw/react-color-compact";
import { FC, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { EnumOptionT } from "types";
import * as yup from "yup";

const optionSchema = yup.object().shape({
    value: yup.string().required("form.validation.required"),
    color: yup.string().nullable().default(null),
});

type OptionFormData = yup.InferType<typeof optionSchema>;

interface IOptionFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: OptionFormData) => void;
    defaultValues?: EnumOptionT | null;
    loading?: boolean;
}

const OptionFormDialog: FC<IOptionFormDialogProps> = ({
    open,
    onClose,
    onSubmit,
    defaultValues,
    loading,
}) => {
    const { t } = useTranslation();

    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm({ defaultValues: defaultValues || { value: "", color: null } });

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const handleClickColorPicker = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseColorPicker = () => {
        setAnchorEl(null);
    };

    const popoverOpen = Boolean(anchorEl);

    useEffect(() => {
        reset(defaultValues || { value: "", color: null });
    }, [defaultValues, reset]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                {t(
                    defaultValues
                        ? "customFields.options.edit"
                        : "customFields.options.new",
                )}
            </DialogTitle>

            <DialogContent>
                <Box display="flex" flexDirection="column" gap={1} mt={1}>
                    <TextField
                        {...register("value")}
                        label={t("customFields.options.value")}
                        error={!!errors.value}
                        helperText={t(errors.value?.message || "")}
                        variant="outlined"
                        size="small"
                        fullWidth
                    />

                    <Controller
                        name="color"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <FormControlLabel
                                sx={{
                                    "&.MuiFormControlLabel-root": {
                                        m: 0,
                                    },
                                }}
                                control={
                                    <>
                                        <Button
                                            sx={{
                                                minWidth: "40px",
                                                height: "40px",
                                                mr: 1,
                                                backgroundColor: value,
                                                "&:hover": {
                                                    backgroundColor: value,
                                                },
                                            }}
                                            onClick={handleClickColorPicker}
                                            variant="outlined"
                                        />

                                        <Popover
                                            open={popoverOpen}
                                            anchorEl={anchorEl}
                                            onClose={handleCloseColorPicker}
                                            anchorOrigin={{
                                                vertical: "bottom",
                                                horizontal: "left",
                                            }}
                                        >
                                            <ColorPicker
                                                color={value || ""}
                                                onChange={(color) =>
                                                    onChange(color.hex)
                                                }
                                            />
                                        </Popover>
                                    </>
                                }
                                label={t("customFields.options.color")}
                            />
                        )}
                    />
                </Box>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    size="small"
                >
                    {t("cancel")}
                </Button>

                <LoadingButton
                    onClick={handleSubmit(onSubmit)}
                    variant="outlined"
                    size="small"
                    loading={loading}
                    disabled={!isDirty}
                >
                    {t("save")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export { OptionFormDialog };
