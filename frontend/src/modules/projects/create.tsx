import { yupResolver } from "@hookform/resolvers/yup";
import { LoadingButton } from "@mui/lab";
import { Box, Button, TextField, Typography } from "@mui/material";
import { Link, useNavigate } from "@tanstack/react-router";
import { MDEditor } from "components";
import { defaultErrorMessage } from "config";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { projectApi } from "store/api";
import * as yup from "yup";

const createProjectSchema = yup.object().shape({
    name: yup.string().required("form.validation.required"),
    slug: yup.string().required("form.validation.required"),
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

    const [createProject, { isLoading }] =
        projectApi.useCreateProjectMutation();

    const onSubmit = (formData: CreateProjectFormData) => {
        createProject(formData)
            .unwrap()
            .then((response) => {
                navigate({
                    to: "/projects/$projectId",
                    params: {
                        projectId: response.payload.id,
                    },
                });
                toast.success(t("projects.create.success"));
            })
            .catch((error) => {
                toast.error(error.data.detail || defaultErrorMessage);
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
                    {...register("slug")}
                    label={t("projects.create.slug")}
                    error={!!errors.name}
                    helperText={t(errors.slug?.message || "")}
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
                    <LoadingButton
                        type="submit"
                        variant="outlined"
                        loading={isLoading}
                    >
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
