import { yupResolver } from "@hookform/resolvers/yup";
import CloseIcon from "@mui/icons-material/Close";
import {
    Autocomplete,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    TextField,
} from "@mui/material";
import { type FC, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { DashboardTileT } from "shared/model/types";
import * as yup from "yup";
import { widgetTypes } from "./utils";

const dashboardWidgetSchema = yup.object().shape({
    name: yup.string().required("form.validation.required"),
    type: yup
        .mixed<(typeof widgetTypes)[0]>()
        .required("form.validation.required"),
    query: yup.string().required("form.validation.required"),
    height: yup
        .number()
        .typeError("form.validation.number")
        .min(160, "dashboards.widgets.height.min")
        .max(800, "dashboards.widgets.height.max")
        .required("form.validation.required"),
});

export type DashboardWidgetFormData = yup.InferType<
    typeof dashboardWidgetSchema
>;

interface WidgetFormDialogProps {
    open: boolean;
    defaultValues?: DashboardTileT | null;
    onClose: () => void;
    onSubmit: (data: DashboardWidgetFormData) => void;
    loading?: boolean;
}

export const WidgetFormDialog: FC<WidgetFormDialogProps> = ({
    open,
    defaultValues,
    onClose,
    onSubmit,
    loading = false,
}) => {
    const { t } = useTranslation();

    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset,
    } = useForm<DashboardWidgetFormData>({
        resolver: yupResolver(dashboardWidgetSchema),
        mode: "onChange",
    });

    const handleClose = () => {
        onClose();
        reset();
    };

    useEffect(() => {
        reset({
            name: defaultValues?.name || "",
            type:
                widgetTypes.find((wt) => wt.type === defaultValues?.type) ||
                widgetTypes[0],
            query: defaultValues?.query || "",
            height: (defaultValues?.ui_settings?.height as number) || 160,
        });
    }, [open, defaultValues, reset]);

    return (
        <Dialog
            component="form"
            open={open}
            onClose={handleClose}
            onSubmit={handleSubmit(onSubmit)}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {defaultValues
                    ? t("dashboards.widgets.edit")
                    : t("dashboards.widgets.add")}

                <IconButton onClick={handleClose} disabled={loading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Stack gap={1} mt={1}>
                    <TextField
                        {...register("name")}
                        label={t("dashboards.widgets.name.label")}
                        error={!!errors.name}
                        helperText={
                            errors.name?.message && t(errors.name.message)
                        }
                        size="small"
                        fullWidth
                    />

                    <Controller
                        name="type"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <Autocomplete
                                value={value}
                                onChange={(_, newValue) => onChange(newValue)}
                                options={widgetTypes}
                                getOptionLabel={(option) => t(option.label)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={t(
                                            "dashboards.widgets.type.label",
                                        )}
                                        error={!!errors.type}
                                        helperText={
                                            errors.type?.message &&
                                            t(errors.type.message)
                                        }
                                        size="small"
                                    />
                                )}
                                fullWidth
                                disabled={!!defaultValues}
                            />
                        )}
                    />

                    <TextField
                        {...register("query")}
                        label={t("dashboards.widgets.query.label")}
                        error={!!errors.query}
                        helperText={
                            errors.query?.message && t(errors.query.message)
                        }
                        size="small"
                        fullWidth
                    />

                    <TextField
                        {...register("height", { valueAsNumber: true })}
                        label={t("dashboards.widgets.height.label")}
                        type="number"
                        error={!!errors.height}
                        helperText={
                            errors.height?.message && t(errors.height.message)
                        }
                        size="small"
                        fullWidth
                        slotProps={{
                            htmlInput: {
                                min: 160,
                                max: 800,
                            },
                        }}
                    />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    size="small"
                    color="error"
                    disabled={loading}
                >
                    {t("cancel")}
                </Button>

                <Button
                    type="submit"
                    variant="outlined"
                    size="small"
                    disabled={!isValid}
                    loading={loading}
                >
                    {t("save")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
