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
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import type { FC } from "react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { VersionOptionT } from "shared/model/types";
import * as yup from "yup";

const versionOptionSchema = yup.object().shape({
    value: yup.string().required("form.validation.required"),
    release_date: yup.string().nullable().default(null),
    is_released: yup.boolean().default(false),
    is_archived: yup.boolean().default(false),
});

type VersionOptionFormData = yup.InferType<typeof versionOptionSchema>;

interface IVersionOptionFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: VersionOptionFormData) => void;
    defaultValues?: VersionOptionT | null;
    loading?: boolean;
}

const VersionOptionFormDialog: FC<IVersionOptionFormDialogProps> = ({
    open,
    onClose,
    onSubmit: onSubmitFromProps,
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
        defaultValues: defaultValues || { value: "", release_date: null },
    });

    const onSubmit = (data: VersionOptionFormData) => {
        const formattedData = {
            ...data,
            release_date: data.release_date
                ? dayjs(data.release_date).format("YYYY-MM-DD")
                : null,
        };
        onSubmitFromProps(formattedData);
    };

    useEffect(() => {
        reset(defaultValues || { value: "", release_date: null });
    }, [open, defaultValues, reset]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            onSubmit={handleSubmit(onSubmit)}
            component="form"
        >
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
                        label={t("customFields.options.version")}
                        error={!!errors.value}
                        helperText={t(errors.value?.message || "")}
                        variant="outlined"
                        size="small"
                        fullWidth
                        autoFocus
                    />

                    <Controller
                        name="release_date"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <LocalizationProvider
                                dateAdapter={AdapterDayjs}
                                adapterLocale="en-gb"
                            >
                                <DatePicker
                                    value={value ? dayjs(value) : null}
                                    label={t(
                                        "customFields.options.version.releaseDate",
                                    )}
                                    onChange={onChange}
                                    format="DD-MM-YYYY"
                                    slotProps={{
                                        textField: {
                                            size: "small",
                                        },
                                        actionBar: {
                                            actions: ["clear"],
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        )}
                    />

                    <Controller
                        name="is_released"
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
                                label={t(
                                    "customFields.options.version.released",
                                )}
                            />
                        )}
                    />

                    <Controller
                        name="is_archived"
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
                                label={t(
                                    "customFields.options.version.archived",
                                )}
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
                    variant="outlined"
                    size="small"
                    loading={loading}
                    disabled={!isDirty}
                    type="submit"
                >
                    {t("save")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { VersionOptionFormDialog };
