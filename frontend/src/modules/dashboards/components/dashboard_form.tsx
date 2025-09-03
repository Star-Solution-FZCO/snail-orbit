import { yupResolver } from "@hookform/resolvers/yup";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, TextField } from "@mui/material";
import type { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { DashboardT } from "shared/model/types";
import { MDEditor } from "shared/ui";
import * as yup from "yup";

const dashboardSchema = yup.object().shape({
    name: yup.string().required("form.validation.required"),
    description: yup.string().nullable().default(null),
});

type DashboardFormData = yup.InferType<typeof dashboardSchema>;

interface IDashboardFormProps {
    defaultValues?: DashboardT;
    onSubmit: (formData: DashboardFormData) => void;
    onDelete?: () => void;
    onCancel?: () => void;
    loading?: boolean;
}

const DashboardForm: FC<IDashboardFormProps> = ({
    defaultValues,
    onSubmit,
    onDelete,
    onCancel,
    loading,
}) => {
    const { t } = useTranslation();

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues,
        resolver: yupResolver(dashboardSchema),
    });

    return (
        <Box
            component="form"
            display="flex"
            flexDirection="column"
            gap={2}
            onSubmit={handleSubmit(onSubmit)}
            maxWidth="md"
        >
            <TextField
                {...register("name")}
                label={t("dashboards.form.name")}
                error={!!errors.name}
                helperText={t(errors.name?.message || "")}
                variant="outlined"
                size="small"
                fullWidth
            />

            <Box>
                <Controller
                    name="description"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <MDEditor
                            value={value || ""}
                            onChange={onChange}
                            placeholder={t("description")}
                        />
                    )}
                />
            </Box>

            <Box display="flex" gap={1}>
                <Button
                    type="submit"
                    variant="outlined"
                    size="small"
                    loading={loading}
                >
                    {t("save")}
                </Button>

                {onCancel && (
                    <Button
                        onClick={onCancel}
                        variant="outlined"
                        color="error"
                        size="small"
                    >
                        {t("cancel")}
                    </Button>
                )}

                {onDelete && (
                    <>
                        <Box flex={1} />

                        <Button
                            onClick={onDelete}
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                        >
                            {t("delete")}
                        </Button>
                    </>
                )}
            </Box>
        </Box>
    );
};

export { DashboardForm };
