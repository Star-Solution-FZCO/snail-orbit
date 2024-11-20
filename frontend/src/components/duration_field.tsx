import { Box, MenuItem, Popper, TextField, Typography } from "@mui/material";
import React, { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const minute = 60;
const hour = minute * 60;
const day = hour * 8;
const week = day * 5;

const timeUnits = [
    { key: "w", label: "week", multiplier: week },
    { key: "d", label: "day", multiplier: day },
    { key: "h", label: "hour", multiplier: hour },
    { key: "m", label: "minute", multiplier: minute },
];

const isValidDuration = (value: string) => {
    const regex = /^(\d+w)?\s*(\d+d)?\s*(\d+h)?\s*(\d+m)?$/;
    return regex.test(value.trim());
};

const convertToSeconds = (duration: string): number => {
    let totalSeconds = 0;

    const parts = duration.trim().split(" ");
    parts.forEach((part) => {
        const unit = timeUnits.find((u) => part.endsWith(u.key));
        if (unit) {
            const value = parseInt(part.replace(unit.key, ""), 10);
            totalSeconds += value * unit.multiplier;
        }
    });

    return totalSeconds;
};

interface IDurationFieldProps {
    label: string;
    initialValue?: string;
    onChange: (value: number) => void;
}

const DurationField: FC<IDurationFieldProps> = ({
    label,
    initialValue,
    onChange,
}) => {
    const { t } = useTranslation();

    const [inputValue, setInputValue] = useState("");
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [filteredUnits, setFilteredUnits] = useState(timeUnits);
    const [error, setError] = useState(false);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setInputValue(value);

        const isValid = isValidDuration(value);
        setError(!isValid);

        if (isValid) {
            const totalSeconds = convertToSeconds(value);
            onChange(totalSeconds);
        }

        const lastPart = value.trim().split(" ").pop() || "";

        if (value.trim() === "") {
            setFilteredUnits([]);
            return;
        }

        if (/\d+$/.test(lastPart)) {
            setFilteredUnits(timeUnits);
        } else {
            setFilteredUnits([]);
        }
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleBlur = () => {
        setTimeout(() => setAnchorEl(null), 200);
    };

    const handleSelectUnit = (unitKey: string) => {
        const parts = inputValue.trim().split(" ");
        parts[parts.length - 1] = `${parts[parts.length - 1]}${unitKey}`;
        const newValue = parts.join(" ") + " ";
        setInputValue(newValue);
        setError(false);
        setAnchorEl(null);

        if (isValidDuration(newValue)) {
            const totalSeconds = convertToSeconds(newValue);
            onChange(totalSeconds);
        }
    };

    useEffect(() => {
        if (initialValue) {
            setInputValue(initialValue);
        }
    }, [initialValue]);

    return (
        <Box sx={{ position: "relative", width: 300 }}>
            <TextField
                label={label}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="1w 1d 1h 1m"
                error={error}
                helperText={error ? t("durationField.invalidFormat") : " "}
                variant="outlined"
                size="small"
                fullWidth
            />

            <Popper
                open={
                    !!anchorEl &&
                    filteredUnits.length > 0 &&
                    inputValue.trim() !== ""
                }
                anchorEl={anchorEl}
                placement="bottom-start"
                style={{ zIndex: 1300 }}
            >
                <Box
                    sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        bgcolor: "background.paper",
                        mt: 1,
                        maxWidth: 300,
                        maxHeight: 200,
                        overflow: "auto",
                    }}
                >
                    {filteredUnits.map((unit) => (
                        <MenuItem
                            key={unit.key}
                            onClick={() => handleSelectUnit(unit.key)}
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 1,
                            }}
                        >
                            <Typography variant="body2">{unit.key}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t(`durationField.${unit.label}`)}
                            </Typography>
                        </MenuItem>
                    ))}
                </Box>
            </Popper>
        </Box>
    );
};

export { DurationField };
