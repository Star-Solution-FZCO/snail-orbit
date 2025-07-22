import ClearIcon from "@mui/icons-material/Clear";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import {
    Box,
    IconButton,
    MenuItem,
    Popper,
    styled,
    TextField,
    Typography,
} from "@mui/material";
import type { FC } from "react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatSpentTime } from "../utils";

const minute = 60;
const hour = minute * 60;
const day = hour * 24;
const week = day * 5;

const timeUnits = [
    { key: "w", label: "week", multiplier: week },
    { key: "d", label: "day", multiplier: day },
    { key: "h", label: "hour", multiplier: hour },
    { key: "m", label: "minute", multiplier: minute },
];

const regex = /^(\d+w)?\s*(\d+d)?\s*(\d+h)?\s*(\d+m)?$/;

const isPartiallyValidDuration = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") return true;

    const parts = trimmed.split(/\s+/);

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (i === parts.length - 1) {
            if (/^\d+$/.test(part)) {
                return true;
            }
            if (/^\d+[wdhm]$/.test(part)) {
                return true;
            }
            return false;
        } else {
            if (!/^\d+[wdhm]$/.test(part)) {
                return false;
            }
        }
    }

    return true;
};

const isValidDuration = (value: string) => {
    return regex.test(value.trim());
};

const convertToSeconds = (duration: string): number => {
    let totalSeconds = 0;

    const parts = duration.trim().split(/\s+/);

    parts.forEach((part) => {
        const unit = timeUnits.find((u) => part.endsWith(u.key));
        if (unit) {
            const value = parseInt(part.replace(unit.key, ""), 10);
            totalSeconds += value * unit.multiplier;
        }
    });

    return totalSeconds;
};

const PopperContentWrapper = styled(Box)(({ theme }) => ({
    border: 1,
    borderColor: "divider",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    marginTop: theme.spacing(1),
    maxWidth: 300,
    maxHeight: 200,
    overflow: "auto",
}));

interface ISpentTimeFieldProps {
    label?: string;
    initialValue?: number;
    onChange?: (value: number) => void;
}

const SpentTimeField: FC<ISpentTimeFieldProps> = ({
    label,
    initialValue,
    onChange,
}) => {
    const { t } = useTranslation();

    const [inputValue, setInputValue] = useState("");
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [filteredUnits, setFilteredUnits] = useState(timeUnits);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setInputValue(value);

        const parts = value.trim().split(/\s+/);
        const lastPart = parts[parts.length - 1] || "";

        const isComplete = timeUnits.some((unit) =>
            lastPart.endsWith(unit.key),
        );

        const isPartialValid = isPartiallyValidDuration(value);
        const isFullyValid = isValidDuration(value);

        const hasError = !isPartialValid;
        setError(hasError);

        if (hasError && value.trim() !== "") {
            setErrorMessage(t("durationField.invalidFormat"));
        } else {
            setErrorMessage("");
        }

        if (isFullyValid) {
            onChange?.(convertToSeconds(value));
        }

        if (!isComplete && /^\d+$/.test(lastPart)) {
            const usedUnits = new Set(
                parts
                    .slice(0, -1)
                    .map((part) =>
                        timeUnits.find((unit) => part.endsWith(unit.key)),
                    )
                    .filter(Boolean)
                    .map((unit) => unit!.key),
            );

            setFilteredUnits(
                timeUnits.filter((unit) => !usedUnits.has(unit.key)),
            );
        } else {
            setFilteredUnits([]);
        }
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        setAnchorEl(event.currentTarget);
        setIsFocused(true);
    };

    const handleBlur = () => {
        setTimeout(() => {
            setAnchorEl(null);
            setIsFocused(false);
        }, 200);
    };

    const handleSelectUnit = (unitKey: string) => {
        const parts = inputValue.trim().split(/\s+/);

        parts[parts.length - 1] = `${parts[parts.length - 1]}${unitKey}`;

        const newValue = parts.join(" ") + " ";

        setInputValue(newValue);
        setIsFocused(false);
        setError(false);
        setErrorMessage("");

        setAnchorEl(null);

        if (isValidDuration(newValue)) {
            const totalSeconds = convertToSeconds(newValue);
            onChange?.(totalSeconds);
        }
    };

    const handleClear = () => {
        setInputValue("");
        setError(false);
        setErrorMessage("");
        onChange?.(0);
    };

    const trimmedValue = inputValue.trim();
    const lastChar = trimmedValue.charAt(trimmedValue.length - 1);

    const popperOpen =
        isFocused &&
        Boolean(anchorEl) &&
        ((error && errorMessage) ||
            (trimmedValue !== "" &&
                !isNaN(Number(lastChar)) &&
                filteredUnits.length > 0) ||
            trimmedValue === "");

    useEffect(() => {
        if (initialValue) {
            setInputValue(formatSpentTime(initialValue));
        }
    }, [initialValue]);

    const renderPopperContent = () => {
        if (error && errorMessage) {
            return (
                <PopperContentWrapper>
                    <Typography variant="body2" color="error" p={1}>
                        {errorMessage}
                    </Typography>
                </PopperContentWrapper>
            );
        }

        if (
            filteredUnits.length > 0 &&
            trimmedValue !== "" &&
            !isNaN(Number(lastChar))
        ) {
            return (
                <PopperContentWrapper>
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
                </PopperContentWrapper>
            );
        }

        return (
            <PopperContentWrapper>
                <Typography variant="body2" color="text.secondary" p={1}>
                    {t("durationField.tooltip")}
                </Typography>
            </PopperContentWrapper>
        );
    };

    return (
        <Box sx={{ position: "relative" }}>
            <TextField
                label={label}
                value={inputValue}
                placeholder="1w 1d 1h 1m"
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                slotProps={{
                    input: {
                        startAdornment: <HourglassTopIcon />,
                        endAdornment: (
                            <IconButton
                                onClick={handleClear}
                                size="small"
                                disabled={inputValue.trim() === ""}
                            >
                                <ClearIcon />
                            </IconButton>
                        ),
                    },
                }}
                error={error}
                variant="outlined"
                size="small"
            />

            <Popper
                open={!!popperOpen}
                anchorEl={anchorEl}
                placement="bottom-start"
                style={{ zIndex: 1300 }}
            >
                {renderPopperContent()}
            </Popper>
        </Box>
    );
};

export { SpentTimeField };
