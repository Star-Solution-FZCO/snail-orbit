import { MenuItem, Select, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ReportDisplayType } from "shared/model/types/report";

type ReportTypeSelectProps = {
    value?: ReportDisplayType;
    onChange?: (value: ReportDisplayType) => void;
};

export const ReportTypeSelect = (props: ReportTypeSelectProps) => {
    const { onChange, value } = props;
    const { t } = useTranslation();

    return (
        <Stack direction="row" gap={2}>
            <span>{t("reportType")}:</span>
            <Select
                variant="standard"
                size="small"
                value={value}
                onChange={(e) =>
                    onChange?.(e.target.value as ReportDisplayType)
                }
            >
                <MenuItem value={ReportDisplayType.TABLE}>
                    {t("table")}
                </MenuItem>
                <MenuItem value={ReportDisplayType.LINE_CHART}>
                    {t("line chart")}
                </MenuItem>
                <MenuItem value={ReportDisplayType.BAR_CHART}>
                    {t("bar chart")}
                </MenuItem>
            </Select>
        </Stack>
    );
};
