import { yupResolver } from "@hookform/resolvers/yup";
import { LoadingButton } from "@mui/lab";
import { Box, Button, TextField, Typography } from "@mui/material";
import { Link, useNavigate } from "@tanstack/react-router";
import { MDEditor } from "components";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";

const createProjectSchema = yup.object().shape({
    name: yup.string().required("form.validation.required"),
    id: yup.string().required("form.validation.required"),
    description: yup.string(),
});

type CreateProjectFormData = yup.InferType<typeof createProjectSchema>;

const ProjectCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(createProjectSchema),
    });

    const onSubmit = (formData: CreateProjectFormData) => {
        console.log(formData);
        navigate({
            to: "/projects",
        });
    };

    return (
        <Box
            margin="0 auto"
            width="1080px"
            display="flex"
            flexDirection="column"
        >
            <Typography fontSize={24} fontWeight="bold" mt={3}>
                {t("projects.create.title")}
            </Typography>

            <Box
                component="form"
                mt={2}
                display="flex"
                flexDirection="column"
                gap={2}
                onSubmit={handleSubmit(onSubmit)}
            >
                <Typography fontSize={20} fontWeight="bold">
                    {t("projects.create.generalInfo")}
                </Typography>

                <TextField
                    {...register("name")}
                    label={t("projects.create.name")}
                    error={!!errors.name}
                    helperText={t(errors.name?.message || "")}
                    variant="outlined"
                    fullWidth
                />

                <TextField
                    {...register("id")}
                    label={t("projects.create.id")}
                    error={!!errors.name}
                    helperText={t(errors.id?.message || "")}
                    variant="outlined"
                    fullWidth
                />

                <Box>
                    <Typography mb={1}>
                        {t("projects.create.description")}
                    </Typography>
                    <Controller
                        name="description"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <MDEditor value={value} onChange={onChange} />
                        )}
                    />
                </Box>

                <Box display="flex" gap={1}>
                    <LoadingButton type="submit" variant="outlined">
                        {t("projects.create.submit")}
                    </LoadingButton>

                    <Link to="/projects">
                        <Button variant="outlined" color="error">
                            {t("projects.create.cancel")}
                        </Button>
                    </Link>
                </Box>
            </Box>
        </Box>
    );
};

export { ProjectCreate };
