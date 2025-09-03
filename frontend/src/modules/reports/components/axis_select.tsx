import type { SelectChangeEvent } from "@mui/material";
import { MenuItem, Select, Stack, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { AxisT, AxisTypeT } from "shared/model/types/report";

type AxisSelectProps = {
    value?: AxisT;
    onChange?: (value: AxisT) => void;
};

export const AxisSelect = (props: AxisSelectProps) => {
    const { onChange, value } = props;
    const { t } = useTranslation();

    const handleSelectType = (event: SelectChangeEvent<AxisTypeT>) => {
        onChange?.({
            type: event.target.value as AxisTypeT,
            custom_field: null,
        });
    };

    return (
        <Stack direction="row" gap={2}>
            <span>{t("axis.describedBy")}:</span>
            <Select
                variant="standard"
                size="small"
                value={value?.type}
                onChange={handleSelectType}
            >
                <MenuItem value="project">{t("project")}</MenuItem>
                <MenuItem value="custom_field">{t("custom field")}</MenuItem>
            </Select>
            <span>{t("axis.withCustomField")}:</span>
            <TextField
                variant="standard"
                size="small"
                slotProps={{
                    input: { readOnly: true },
                }}
                sx={{ input: { cursor: "pointer" } }}
                value={value?.custom_field?.name || "-"}
            />
        </Stack>
    );
};
