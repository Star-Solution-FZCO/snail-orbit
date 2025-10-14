import { yupResolver } from "@hookform/resolvers/yup";
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
import dayjs from "dayjs";
import type { FC } from "react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { SprintOptionT } from "shared/model/types";
import { ColorInputField } from "shared/ui/color_picker/color_input_field";
import { DateRangePicker } from "shared/ui/daterange";
import * as yup from "yup";

const sprintOptionSchema = yup.object().shape({
    value: yup.string().required("form.validation.required"),
    description: yup.string().nullable().default(null),
    color: yup.string().nullable().default(null),
    start_date: yup.string().nullable().default(null),
    end_date: yup.string().nullable().default(null),
    is_archived: yup.boolean().default(false),
    is_completed: yup.boolean().default(false),
});

type SprintOptionFormData = yup.InferType<typeof sprintOptionSchema>;

interface ISprintOptionFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: SprintOptionFormData) => void;
    defaultValues?: SprintOptionT | null;
    loading?: boolean;
}

const optionDefaultValues = {
    value: "",
    is_completed: false,
    is_archived: false,
    color: "#ccc",
    start_date: null,
    end_date: null,
    description: null,
};

const formatDate = (date: string | null) => {
    return date ? dayjs(date).format("YYYY-MM-DD") : null;
};

const SprintOptionFormDialog: FC<ISprintOptionFormDialogProps> = ({
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
        watch,
        setValue,
        formState: { errors, isDirty },
    } = useForm<SprintOptionFormData>({
        resolver: yupResolver(sprintOptionSchema),
        defaultValues: optionDefaultValues,
    });

    const startDate = watch("start_date");
    const endDate = watch("end_date");

    const onSubmit = (data: SprintOptionFormData) => {
        const formattedData = {
            ...data,
            start_date: formatDate(data.start_date),
            end_date: formatDate(data.end_date),
        };
        onSubmitFromProps(formattedData);
    };

    useEffect(() => {
        reset(defaultValues || optionDefaultValues);
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
                        label={t("customFields.options.sprint.value")}
                        error={!!errors.value}
                        helperText={t((errors.value?.message as string) || "")}
                        variant="outlined"
                        size="small"
                        fullWidth
                        autoFocus
                    />

                    <TextField
                        {...register("description")}
                        label={t("customFields.options.sprint.description")}
                        error={!!errors.description}
                        helperText={t(
                            (errors.description?.message as string) || "",
                        )}
                        variant="outlined"
                        size="small"
                        multiline
                        rows={4}
                        fullWidth
                    />

                    <Controller
                        name="color"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <ColorInputField
                                color={value || ""}
                                onChange={onChange}
                                size="small"
                                label={t("customFields.options.color")}
                            />
                        )}
                    />

                    <DateRangePicker
                        value={{
                            from: startDate ? dayjs(startDate).toDate() : null,
                            to: endDate ? dayjs(endDate).toDate() : null,
                        }}
                        onChange={(range) => {
                            setValue(
                                "start_date",
                                range?.from
                                    ? dayjs(range.from).format("YYYY-MM-DD")
                                    : null,
                                { shouldDirty: true },
                            );
                            setValue(
                                "end_date",
                                range?.to
                                    ? dayjs(range.to).format("YYYY-MM-DD")
                                    : null,
                                { shouldDirty: true },
                            );
                        }}
                    />

                    <Controller
                        name="is_completed"
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
                                    "customFields.options.sprint.completed",
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
                                    "customFields.options.sprint.archived",
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

export { SprintOptionFormDialog };
