import { yupResolver } from "@hookform/resolvers/yup";
import { LoadingButton } from "@mui/lab";
import { Box, Button, TextField } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { CKMDEditor } from "components";
import { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { GroupT } from "types";
import * as yup from "yup";

const groupSchema = yup.object().shape({
    name: yup.string().required("form.validation.required"),
    description: yup.string().nullable().default(null),
});

type GroupFormData = yup.InferType<typeof groupSchema>;

interface IGroupFormProps {
    defaultValues?: GroupT;
    onSubmit: (formData: GroupFormData) => void;
    loading?: boolean;
    hideCancel?: boolean;
}

const GroupForm: FC<IGroupFormProps> = ({
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
        resolver: yupResolver(groupSchema),
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
                label={t("groups.form.name")}
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
                        <CKMDEditor
                            value={value || ""}
                            onChange={onChange}
                            placeholder={t("description")}
                        />
                    )}
                />
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

export { GroupForm };
