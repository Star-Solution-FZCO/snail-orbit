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

const regex = /^(\d+w)?\s*(\d+d)?\s*(\d+h)?\s*(\d+m)?$/;

const isValidDuration = (value: string) => {
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
    label: string;
    initialValue?: string;
    onChange: (value: number) => void;
}

const SpentTimeField: FC<ISpentTimeFieldProps> = ({
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

        const parts = value.trim().split(" ");
        const lastPart = parts[parts.length - 1] || "";

        const isComplete = timeUnits.some((unit) =>
            lastPart.endsWith(unit.key),
        );
        const isValid = isValidDuration(value);

        if (!isComplete && /^\d+$/.test(lastPart)) {
            const usedUnits = new Set(
                parts
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

    const handleClear = () => {
        setInputValue("");
        onChange(0);
    };

    const trimmedValue = inputValue.trim();
    const lastChar = trimmedValue.charAt(trimmedValue.length - 1);
    const popperOpen =
        Boolean(anchorEl) && trimmedValue !== "" && !isNaN(Number(lastChar));

    useEffect(() => {
        if (initialValue) {
            setInputValue(initialValue);
        }
    }, [initialValue]);

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
                open={popperOpen}
                anchorEl={anchorEl}
                placement="bottom-start"
                style={{ zIndex: 1300 }}
            >
                {error ? (
                    <PopperContentWrapper>
                        <Typography variant="body2" color="error" p={1}>
                            {t("durationField.invalidFormat")}
                        </Typography>
                    </PopperContentWrapper>
                ) : filteredUnits.length > 0 ? (
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
                                <Typography variant="body2">
                                    {unit.key}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {t(`durationField.${unit.label}`)}
                                </Typography>
                            </MenuItem>
                        ))}
                    </PopperContentWrapper>
                ) : null}
            </Popper>
        </Box>
    );
};

export { SpentTimeField };
