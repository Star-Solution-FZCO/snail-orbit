import { yupResolver } from "@hookform/resolvers/yup";
import { Box, Button, TextField } from "@mui/material";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { CreateGlobalRoleT, GlobalRoleT } from "shared/model/types";
import { Link } from "shared/ui";
import * as yup from "yup";

const globalRoleSchema = yup.object().shape({
    name: yup.string().required("form.validation.required"),
    description: yup.string().nullable().default(null),
});

type GlobalRoleFormData = yup.InferType<typeof globalRoleSchema>;

interface IGlobalRoleFormProps {
    role?: GlobalRoleT;
    onSubmit: (data: GlobalRoleFormData) => void | Promise<void>;
    loading?: boolean;
    hideCancel?: boolean;
}

const GlobalRoleForm: FC<IGlobalRoleFormProps> = ({
    role: defaultValues,
    onSubmit,
    loading,
    hideCancel = false,
}) => {
    const { t } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateGlobalRoleT>({
        defaultValues,
        resolver: yupResolver(globalRoleSchema),
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
                label={t("globalRoles.fields.name")}
                error={!!errors.name}
                helperText={errors.name?.message}
                size="small"
                fullWidth
            />

            <TextField
                {...register("description")}
                label={t("description")}
                error={!!errors.description}
                helperText={errors.description?.message}
                size="small"
                fullWidth
                multiline
                rows={3}
            />

            <Box display="flex" gap={1}>
                <Button
                    type="submit"
                    variant="outlined"
                    size="small"
                    loading={loading}
                >
                    {t("save")}
                </Button>

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

export { GlobalRoleForm };
