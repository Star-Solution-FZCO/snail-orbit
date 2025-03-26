import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    TextField,
} from "@mui/material";
import { ColorInputField } from "components/color_picker/color_input_field";
import type { FC } from "react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { StateOptionT } from "types";
import * as yup from "yup";

const stateOptionSchema = yup.object().shape({
    value: yup.string().required("form.validation.required"),
    color: yup.string().nullable().default(null),
    is_resolved: yup.boolean().default(false),
    is_closed: yup.boolean().default(false),
});

type StateOptionFormData = yup.InferType<typeof stateOptionSchema>;

interface IStateOptionFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: StateOptionFormData) => void;
    defaultValues?: StateOptionT | null;
    loading?: boolean;
}

const StateOptionFormDialog: FC<IStateOptionFormDialogProps> = ({
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
    } = useForm({
        defaultValues: defaultValues || {
            value: "",
            color: "#ccc",
            is_resolved: false,
            is_closed: false,
        },
    });

    useEffect(() => {
        reset(
            defaultValues || {
                value: "",
                color: "#ccc",
                is_resolved: false,
                is_closed: false,
            },
        );
    }, [open, defaultValues, reset]);

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
                            <ColorInputField
                                color={value || "#ccc"}
                                onChange={onChange}
                                size="small"
                                label={t("customFields.options.color")}
                            />
                        )}
                    />

                    <Controller
                        name="is_resolved"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={value}
                                        size="small"
                                        disableRipple
                                        onChange={(e) =>
                                            onChange(e.target.checked)
                                        }
                                    />
                                }
                                label={t("customFields.options.state.resolved")}
                            />
                        )}
                    />

                    <Controller
                        name="is_closed"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={value}
                                        size="small"
                                        disableRipple
                                        onChange={(e) =>
                                            onChange(e.target.checked)
                                        }
                                    />
                                }
                                label={t("customFields.options.state.closed")}
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

                <Button
                    onClick={handleSubmit(onSubmit)}
                    variant="outlined"
                    size="small"
                    loading={loading}
                    disabled={!isDirty}
                >
                    {t("save")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { StateOptionFormDialog };
