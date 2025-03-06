import {
    Box,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import {
    DatePicker,
    DateTimePicker,
    LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CustomFieldOptionT, CustomFieldTypeT, CustomFieldValueT } from "types";
import { defaultValueGetter, getOptionLabel, getOptionValue } from "./utils";

interface InputProps<T> {
    value: T;
    onChange: (value: T) => void;
    label: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    type?: string;
}

const RenderTextField: FC<InputProps<string | number | null>> = ({
    value,
    onChange,
    label,
    error,
    helperText,
    disabled,
    type = "text",
}) => (
    <TextField
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        label={label}
        error={error}
        helperText={helperText}
        variant="outlined"
        size="small"
        disabled={disabled}
        fullWidth
        type={type}
    />
);

const RenderSelect: FC<
    InputProps<string | string[] | number | boolean | null> & {
        options?: CustomFieldOptionT[];
        multiple?: boolean;
    }
> = ({ value, onChange, label, error, options, multiple = false }) => {
    const { t } = useTranslation();
    return (
        <FormControl size="small">
            <InputLabel>{label}</InputLabel>
            <Select
                value={value ?? (multiple ? [] : "")}
                label={label}
                onChange={(e) => onChange(e.target.value)}
                error={error}
                multiple={multiple}
                size="small"
            >
                {!multiple && (
                    <MenuItem key="no_value" value="">
                        {t("customFields.form.noDefaultValue")}
                    </MenuItem>
                )}
                {options?.map((option) => (
                    <MenuItem key={option.uuid} value={getOptionValue(option)}>
                        {getOptionLabel(option)}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

const RenderBooleanSwitch: FC<InputProps<boolean>> = ({
    value,
    onChange,
    label,
}) => {
    const { t } = useTranslation();
    return (
        <FormControlLabel
            sx={{ m: 0, "& .MuiFormControlLabel-label": { ml: 1 } }}
            label={"- " + label}
            control={
                <Box display="flex" alignItems="center">
                    <Typography>
                        {t("customFields.form.defaultValue.boolean.false")}
                    </Typography>
                    <Switch
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                    />
                    <Typography>
                        {t("customFields.form.defaultValue.boolean.true")}
                    </Typography>
                </Box>
            }
        />
    );
};

const RenderDatePicker: FC<InputProps<string | null>> = ({
    value,
    onChange,
    label,
    disabled,
}) => (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <DatePicker
            value={value ? dayjs(value) : null}
            onChange={(newValue) =>
                onChange(newValue ? newValue.format("YYYY-MM-DD") : null)
            }
            label={label}
            slotProps={{ textField: { size: "small" } }}
            disabled={disabled}
        />
    </LocalizationProvider>
);

const RenderDateTimePicker: FC<InputProps<string | null>> = ({
    value,
    onChange,
    label,
    disabled,
}) => (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <DateTimePicker
            value={value ? dayjs(value) : null}
            onChange={(newValue) =>
                onChange(
                    newValue ? newValue.format("YYYY-MM-DDTHH:mm:ss") : null,
                )
            }
            label={label}
            slotProps={{ textField: { size: "small" } }}
            disabled={disabled}
        />
    </LocalizationProvider>
);

export const DefaultValueInput: FC<{
    value: CustomFieldValueT;
    type: CustomFieldTypeT;
    options?: CustomFieldOptionT[];
    onChange: (value: CustomFieldValueT) => void;
    error?: boolean;
    errorMessage?: string;
    disabled?: boolean;
}> = ({ value, type, options, onChange, error, errorMessage, disabled }) => {
    const { t } = useTranslation();
    const label = t("customFields.form.defaultValue");
    const helperText = errorMessage ? t(errorMessage) : "";

    return useMemo(() => {
        switch (type) {
            case "string":
                return (
                    <RenderTextField
                        value={value}
                        onChange={onChange}
                        label={label}
                        error={error}
                        helperText={helperText}
                        disabled={disabled}
                    />
                );
            case "boolean":
                return (
                    <RenderBooleanSwitch
                        value={value}
                        onChange={onChange}
                        label={label}
                    />
                );
            case "integer":
            case "float":
                return (
                    <RenderTextField
                        value={value}
                        onChange={onChange}
                        label={label}
                        error={error}
                        helperText={helperText}
                        disabled={disabled}
                        type="number"
                    />
                );
            case "date":
                return (
                    <RenderDatePicker
                        value={value}
                        onChange={onChange}
                        label={label}
                        disabled={disabled}
                    />
                );
            case "datetime":
                return (
                    <RenderDateTimePicker
                        value={value}
                        onChange={onChange}
                        label={label}
                        disabled={disabled}
                    />
                );
            case "state":
            case "enum":
            case "user":
            case "version":
                return (
                    <RenderSelect
                        value={defaultValueGetter(value)}
                        onChange={onChange}
                        label={label}
                        error={error}
                        options={options}
                    />
                );
            case "enum_multi":
            case "user_multi":
            case "version_multi":
                return (
                    <RenderSelect
                        value={defaultValueGetter(value)}
                        onChange={onChange}
                        label={label}
                        error={error}
                        options={options}
                        multiple
                    />
                );
            default:
                return null;
        }
    }, [value, type, options, onChange, error, errorMessage, disabled]);
};
