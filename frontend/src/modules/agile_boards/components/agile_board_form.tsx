import { yupResolver } from "@hookform/resolvers/yup";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";
import { Box, Button, FormLabel, IconButton, TextField } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { MDEditor } from "components";
import { FC } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AgileBoardT } from "types";
import * as yup from "yup";

const agileBoardSchema = yup.object().shape({
    name: yup.string().required("form.validation.required"),
    description: yup.string().nullable().default(null),
    query: yup.string().nullable().default(null),
    column_field: yup.string().nullable().default(null),
    columns: yup.array().of(yup.string().required()).required(),
});

type AgileBoardFormData = yup.InferType<typeof agileBoardSchema>;

interface IAgileBoardFormProps {
    defaultValues?: AgileBoardT;
    onSubmit: (formData: AgileBoardFormData) => void;
    loading?: boolean;
    hideCancel?: boolean;
}

const AgileBoardForm: FC<IAgileBoardFormProps> = ({
    defaultValues,
    onSubmit,
    loading,
    hideCancel,
}) => {
    const { t } = useTranslation();

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues,
        resolver: yupResolver(agileBoardSchema),
    });

    const { fields, append, remove } = useFieldArray({
        control,
        // @ts-ignore
        name: "columns",
    });

    return (
        <Box
            component="form"
            display="flex"
            flexDirection="column"
            gap={2}
            onSubmit={handleSubmit(onSubmit)}
            maxWidth="800px"
        >
            <TextField
                {...register("name")}
                label={t("agileBoards.form.name")}
                error={!!errors.name}
                helperText={t(errors.name?.message || "")}
                variant="outlined"
                size="small"
                required
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
                            textareaProps={{
                                placeholder: t("agileBoards.form.description"),
                            }}
                        />
                    )}
                />
            </Box>

            <TextField
                {...register("query")}
                label={t("agileBoards.form.query")}
                error={!!errors.query}
                helperText={t(errors.query?.message || "")}
                variant="outlined"
                size="small"
                fullWidth
            />

            <TextField
                {...register("column_field")}
                label={t("agileBoards.form.column_field")}
                error={!!errors.column_field}
                helperText={t(errors.column_field?.message || "")}
                variant="outlined"
                size="small"
                fullWidth
            />

            <Box display="flex" flexDirection="column" gap={1}>
                <FormLabel>{t("agileBoards.form.columns")}</FormLabel>

                {fields.map((field, index) => (
                    <Box
                        key={field.id}
                        display="flex"
                        alignItems="center"
                        gap={1}
                    >
                        <TextField
                            {...register(`columns.${index}` as const)}
                            label={t(`agileBoards.form.column`)}
                            error={!!errors.columns?.[index]}
                            helperText={t(
                                errors.columns?.[index]?.message || "",
                            )}
                            variant="outlined"
                            size="small"
                            fullWidth
                        />
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => remove(index)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                ))}

                <Button
                    sx={{ alignSelf: "flex-start" }}
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => append("")}
                >
                    {t("agileBoards.form.addColumn")}
                </Button>
            </Box>

            <Box display="flex" gap={1}>
                <LoadingButton
                    type="submit"
                    variant="outlined"
                    size="small"
                    loading={loading}
                >
                    {t("save")}
                </LoadingButton>

                {!hideCancel && (
                    <Link to="..">
                        <Button variant="outlined" color="error" size="small">
                            {t("cancel")}
                        </Button>
                    </Link>
                )}
            </Box>
        </Box>
    );
};

export { AgileBoardForm };
