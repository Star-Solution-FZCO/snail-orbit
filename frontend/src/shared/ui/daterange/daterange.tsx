import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CancelIcon from "@mui/icons-material/Cancel";
import {
    Button,
    ClickAwayListener,
    IconButton,
    InputAdornment,
    Popper,
    Stack,
    TextField,
} from "@mui/material";
import { FC, useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { useTranslation } from "react-i18next";
import dayjs, { weekStart } from "shared/date";
import { StyledDayPickerContainer } from "./daterange.styles";

interface DateRangePickerProps {
    value: { from: Date | null; to: Date | null } | null;
    onChange: (value: { from: Date | null; to: Date | null } | null) => void;
}

export const DateRangePicker: FC<DateRangePickerProps> = ({
    value,
    onChange,
}) => {
    const { t } = useTranslation();

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleClickCalendar = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(anchorEl ? null : event.currentTarget.closest("div"));
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleDateSelect = (dateRange: DateRange | undefined) => {
        if (!dateRange) {
            onChange(null);
            return;
        }

        onChange({
            from: dateRange.from || null,
            to: dateRange.to || null,
        });
    };

    const formatValue = (
        val: { from: Date | null; to: Date | null } | null,
    ) => {
        if (!val?.from) return "";

        const fromStr = dayjs(val.from).format("DD/MM/YYYY");
        const toStr = val.to ? dayjs(val.to).format("DD/MM/YYYY") : "";

        return toStr ? `${fromStr} - ${toStr}` : fromStr;
    };

    const handleClear = () => {
        onChange(null);
    };

    const selectedRange: DateRange | undefined = value?.from
        ? {
              from: value.from,
              to: value.to || undefined,
          }
        : undefined;

    const open = Boolean(anchorEl);
    const displayValue = formatValue(value);

    return (
        <>
            <TextField
                sx={{
                    input: {
                        cursor: "pointer",
                    },
                }}
                value={displayValue}
                placeholder="DD/MM/YYYY - DD/MM/YYYY"
                onClick={handleClickCalendar}
                slotProps={{
                    input: {
                        readOnly: true,
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton size="small" edge="end">
                                    <CalendarMonthIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
                size="small"
                fullWidth
            />

            <Popper
                open={open}
                anchorEl={anchorEl}
                sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
                placement="bottom-start"
            >
                <ClickAwayListener onClickAway={handleClose}>
                    <Stack
                        p={2}
                        border={1}
                        borderColor="divider"
                        boxShadow={(theme) => theme.shadows[8]}
                        borderRadius={1.5}
                        bgcolor="background.default"
                    >
                        <StyledDayPickerContainer>
                            <DayPicker
                                selected={selectedRange}
                                onSelect={handleDateSelect}
                                mode="range"
                                numberOfMonths={2}
                                weekStartsOn={weekStart}
                            />
                        </StyledDayPickerContainer>

                        <Stack mt={2} direction="row" gap={1}>
                            <Button
                                onClick={handleClose}
                                variant="outlined"
                                size="small"
                                color="error"
                            >
                                {t("close")}
                            </Button>

                            <Button
                                onClick={handleClear}
                                variant="outlined"
                                size="small"
                                color="secondary"
                                startIcon={<CancelIcon />}
                            >
                                {t("clear")}
                            </Button>
                        </Stack>
                    </Stack>
                </ClickAwayListener>
            </Popper>
        </>
    );
};
