import { yupResolver } from "@hookform/resolvers/yup";
import { LocalOfferOutlined } from "@mui/icons-material";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    FormGroup,
    Stack,
    Switch,
    TextField,
} from "@mui/material";
import { memo, useCallback, useEffect } from "react";
import type { SubmitHandler } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ColorPickerAdornment } from "shared/ui/color_picker/color_picker_adornment";
import { useSchema } from "shared/utils/hooks/use-schema";
import { formDataToTag, tagToFormData } from "./tag_form_dialog.helpers";
import type { TagFormData, TagFormDialogProps } from "./tag_form_dialog.types";
import { getTagFormSchema } from "./tag_form_dialog.types";

export const TagFormDialog = memo((props: TagFormDialogProps) => {
    const {
        open,
        onClose,
        onSubmit: submitHandler,
        defaultValues,
        isLoading,
    } = props;
    const { t } = useTranslation();
    const schema = useSchema(getTagFormSchema);
    const {
        control,
        register,
        formState: { errors, isValid },
        handleSubmit,
        reset,
    } = useForm<TagFormData>({
        resolver: yupResolver(schema),
        disabled: isLoading || false,
        mode: "onChange",
        defaultValues: defaultValues ? tagToFormData(defaultValues) : undefined,
    });

    useEffect(() => {
        if (open)
            reset(defaultValues ? tagToFormData(defaultValues) : undefined);
    }, [open, defaultValues]);

    const onSubmit: SubmitHandler<TagFormData> = useCallback(
        (data) => {
            if (submitHandler) submitHandler(formDataToTag(data));
        },
        [submitHandler],
    );

    return (
        <Dialog
            open={open}
            maxWidth="xs"
            fullWidth
            onClose={onClose}
            PaperProps={{
                component: "form",
                onSubmit: handleSubmit(onSubmit),
            }}
        >
            <DialogTitle sx={{ pb: 0 }}>
                {defaultValues
                    ? t("tagFormDialog.title.editTag")
                    : t("tagFormDialog.title.createTag")}
                {isLoading ? (
                    <CircularProgress sx={{ ml: 1 }} size={14} />
                ) : undefined}
            </DialogTitle>
            <DialogContent sx={{ pt: "16px !important" }}>
                <Stack direction="column" gap={2}>
                    <TextField
                        {...register("name")}
                        label={t("tagFormDialog.name.label")}
                        error={!!errors.name}
                        helperText={errors.name?.message || ""}
                        variant="outlined"
                        size="small"
                        fullWidth
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <Controller
                                        control={control}
                                        name="color"
                                        render={({
                                            field: { value, onChange },
                                        }) => (
                                            <ColorPickerAdornment
                                                color={value || "#fff"}
                                                onChange={onChange}
                                            >
                                                <LocalOfferOutlined
                                                    sx={{
                                                        width: "75%",
                                                        height: "75%",
                                                    }}
                                                />
                                            </ColorPickerAdornment>
                                        )}
                                    />
                                ),
                            },
                        }}
                    />

                    <TextField
                        {...register("description")}
                        label={t("tagFormDialog.description.label")}
                        error={!!errors.description}
                        helperText={t(errors.description?.message || "")}
                        variant="outlined"
                        size="small"
                        multiline
                        rows={3}
                        fullWidth
                    />

                    <TextField
                        {...register("aiDescription")}
                        label={t("tagFormDialog.aiDescription.label")}
                        error={!!errors.aiDescription}
                        helperText={t(errors.aiDescription?.message || "")}
                        variant="outlined"
                        size="small"
                        multiline
                        rows={3}
                        fullWidth
                    />

                    <FormGroup>
                        <Controller
                            control={control}
                            name="untagOnClose"
                            render={({
                                field: { value, onChange, disabled },
                            }) => (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={value}
                                            onChange={onChange}
                                            disabled={disabled}
                                        />
                                    }
                                    label={t(
                                        "tagFormDialog.untagOnClose.label",
                                    )}
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="untagOnResolve"
                            render={({
                                field: { value, onChange, disabled },
                            }) => (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={value}
                                            onChange={onChange}
                                            disabled={disabled}
                                        />
                                    }
                                    label={t(
                                        "tagFormDialog.untagOnResolve.label",
                                    )}
                                />
                            )}
                        />
                    </FormGroup>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button
                    type="button"
                    variant="text"
                    color="inherit"
                    disabled={isLoading}
                    onClick={onClose}
                >
                    {t("cancel")}
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={!isValid || isLoading}
                >
                    {t("save")}
                </Button>
            </DialogActions>
        </Dialog>
    );
});

TagFormDialog.displayName = "TagFormDialog";
