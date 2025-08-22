import {
    Autocomplete,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
} from "@mui/material";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { userApi } from "shared/model";
import type {
    BasicUserT,
    CreateOwnedOptionT,
    ListSelectQueryParams,
    OwnedOptionT,
    UserOrGroupT,
} from "shared/model/types";
import { UserAvatar } from "shared/ui";
import { ColorInputField } from "shared/ui/color_picker/color_input_field";
import { useListQueryParams } from "shared/utils";
type OwnedOptionFormData = {
    value: string;
    owner: BasicUserT | null;
    color: string | null;
};

interface IOwnedOptionFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateOwnedOptionT) => void;
    defaultValues?: OwnedOptionT | null;
    loading?: boolean;
}

const OwnedOptionFormDialog: FC<IOwnedOptionFormDialogProps> = ({
    open,
    onClose,
    onSubmit,
    defaultValues,
    loading,
}) => {
    const { t } = useTranslation();

    const [queryParams] = useListQueryParams<ListSelectQueryParams>({
        limit: 20,
        offset: 0,
    });

    const [searchQuery, setSearchQuery] = useState("");

    const { data, isLoading } = userApi.useListSelectUserOrGroupQuery({
        ...queryParams,
        ...(searchQuery && { search: searchQuery }),
    });

    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { isDirty },
    } = useForm<OwnedOptionFormData>({
        defaultValues: defaultValues
            ? {
                  value: defaultValues.value,
                  owner: defaultValues.owner || null,
                  color: defaultValues.color || null,
              }
            : { value: "", owner: null, color: null },
    });

    const handleInputChange = useCallback((_event: any, value: string) => {
        setSearchQuery(value);
    }, []);

    const options = useMemo(() => {
        return (data?.payload?.items || [])
            .filter(
                (item): item is UserOrGroupT & { type: "user" } =>
                    item.type === "user",
            )
            .map((item) => item.data as BasicUserT);
    }, [data?.payload?.items]);

    useEffect(() => {
        if (open) {
            reset(
                defaultValues
                    ? {
                          value: defaultValues.value,
                          owner: defaultValues.owner || null,
                          color: defaultValues.color || "#ccc",
                      }
                    : { value: "", owner: null, color: "#ccc" },
            );
        }
    }, [open, defaultValues, reset]);

    const handleFormSubmit = useCallback(
        (formData: OwnedOptionFormData) => {
            try {
                // Convert back to the expected format for the API
                const submitData: CreateOwnedOptionT = {
                    value: formData.value,
                    owner: formData.owner?.id || null,
                    color: formData.color,
                };
                onSubmit(submitData);
            } catch (error) {
                console.error("Error in OwnedOptionFormDialog submit:", error);
            }
        },
        [onSubmit],
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
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
                            label={t("customFields.options.value")}
                            variant="outlined"
                            size="small"
                            fullWidth
                            autoFocus
                        />

                        <Controller
                            name="owner"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <Autocomplete
                                    options={options}
                                    value={value}
                                    onChange={(_, newValue) =>
                                        onChange(newValue)
                                    }
                                    onInputChange={handleInputChange}
                                    loading={isLoading}
                                    getOptionLabel={(option) => option.name}
                                    isOptionEqualToValue={(a, b) =>
                                        a.id === b.id
                                    }
                                    filterOptions={(x) => x}
                                    renderOption={(props, option) => {
                                        const { key, ...optionProps } = props;
                                        return (
                                            <Box
                                                component="li"
                                                key={key}
                                                {...optionProps}
                                            >
                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    sx={{ width: 1 }}
                                                    alignItems="center"
                                                >
                                                    <Stack
                                                        direction="row"
                                                        gap={0.5}
                                                        alignItems="center"
                                                    >
                                                        <UserAvatar
                                                            src={
                                                                option.avatar ||
                                                                ""
                                                            }
                                                            size={24}
                                                        />
                                                        <Stack direction="column">
                                                            {option.name}
                                                            <Box
                                                                component="span"
                                                                sx={{
                                                                    color: "text.secondary",
                                                                    fontSize:
                                                                        "0.875rem",
                                                                }}
                                                            >
                                                                {option.email}
                                                            </Box>
                                                        </Stack>
                                                    </Stack>
                                                </Stack>
                                            </Box>
                                        );
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={t(
                                                "customFields.options.owner",
                                            )}
                                            size="small"
                                            placeholder={t(
                                                "customFields.options.selectOwner",
                                            )}
                                        />
                                    )}
                                />
                            )}
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
            </form>
        </Dialog>
    );
};

export { OwnedOptionFormDialog };
