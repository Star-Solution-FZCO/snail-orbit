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
import type { TagDto, TagT } from "shared/model/types/tag";
import { ColorPickerAdornment } from "shared/ui/color_picker/color_picker_adornment";

type TagFormDialogProps = {
    open: boolean;
    onClose?: () => void;
    onBackToList?: () => void;
    onTagCreate?: (data: TagDto) => void;
    onTagUpdate?: (data: TagDto & { id: string }) => void;
    isLoading?: boolean;
    initialData?: TagT | null;
};

export const TagFormDialog = memo((props: TagFormDialogProps) => {
    const {
        open,
        onClose,
        onBackToList,
        onTagCreate,
        onTagUpdate,
        isLoading = false,
        initialData,
    } = props;

    const { t } = useTranslation();

    const {
        control,
        register,
        formState: { errors, isValid },
        handleSubmit,
        reset,
    } = useForm<TagDto>({
        disabled: isLoading,
        mode: "all",
        defaultValues: initialData || {},
    });

    useEffect(() => {
        if (!open) return;
        if (initialData) {
            reset(initialData);
        } else {
            reset();
        }
    }, [initialData, open, reset]);

    const onSubmit: SubmitHandler<TagDto> = useCallback(
        (data) => {
            if (initialData) {
                onTagUpdate?.({ ...data, id: initialData.id });
            } else {
                onTagCreate?.(data);
            }
        },
        [initialData, onTagCreate, onTagUpdate],
    );

    return (
        <Dialog
            open={open}
            maxWidth="xs"
            fullWidth
            onClose={onClose}
            slotProps={{
                paper: { component: "form", onSubmit: handleSubmit(onSubmit) },
            }}
        >
            <DialogTitle sx={{ pb: 0 }}>
                {initialData
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
                        {...register("ai_description")}
                        label={t("tagFormDialog.aiDescription.label")}
                        error={!!errors.ai_description}
                        helperText={t(errors.ai_description?.message || "")}
                        variant="outlined"
                        size="small"
                        multiline
                        rows={3}
                        fullWidth
                    />

                    <FormGroup>
                        <Controller
                            control={control}
                            name="untag_on_close"
                            render={({
                                field: { value, onChange, disabled },
                            }) => (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!!value}
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
                            name="untag_on_resolve"
                            render={({
                                field: { value, onChange, disabled },
                            }) => (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!!value}
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
                {onBackToList && (
                    <Button
                        type="button"
                        variant="text"
                        color="inherit"
                        disabled={isLoading}
                        onClick={onBackToList}
                    >
                        {t("back")}
                    </Button>
                )}
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
