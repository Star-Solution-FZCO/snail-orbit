import type { SelectChangeEvent } from "@mui/material";
import { MenuItem, Select, Stack, TextField } from "@mui/material";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { customFieldsApi } from "shared/model";
import type { CustomFieldGroupT } from "shared/model/types";
import type { AxisT, AxisTypeT } from "shared/model/types/report";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";

type AxisSelectProps = {
    value?: AxisT;
    onChange?: (value: AxisT | null) => void;
    label?: ReactNode;
    withNone?: boolean;
};

export const AxisSelect = (props: AxisSelectProps) => {
    const { onChange, value, label, withNone } = props;
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const { data } = customFieldsApi.useListCustomFieldGroupsQuery(
        { offset: 0, limit: 1000 },
        { skip: !anchorEl },
    );

    const handleSelectType = (event: SelectChangeEvent<AxisTypeT>) => {
        if (!event.target.value) onChange?.(null);
        else
            onChange?.({
                type: event.target.value as AxisTypeT,
                custom_field: null,
            });
    };

    const handleSelectField = (nawValue: CustomFieldGroupT | null) => {
        if (value?.type === "custom_field")
            onChange?.({
                ...value,
                custom_field: nawValue,
            });
    };

    return (
        <Stack direction="row" gap={2}>
            <span>
                {label} {t("axis.describedBy")}:
            </span>
            <Select
                variant="standard"
                size="small"
                value={value?.type || ""}
                onChange={handleSelectType}
                displayEmpty
            >
                {withNone ? <MenuItem value="">{t("none")}</MenuItem> : null}
                <MenuItem value="project">{t("project")}</MenuItem>
                <MenuItem value="custom_field">{t("custom field")}</MenuItem>
            </Select>
            {value?.type === "custom_field" && (
                <>
                    <span>{t("axis.withCustomField")}:</span>
                    <TextField
                        variant="standard"
                        size="small"
                        slotProps={{
                            input: { readOnly: true },
                        }}
                        sx={{ input: { cursor: "pointer" } }}
                        value={value?.custom_field?.name || "-"}
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                    />
                    <FormAutocompletePopover
                        id="axis-select"
                        anchorEl={anchorEl}
                        open={!!anchorEl}
                        onClose={() => setAnchorEl(null)}
                        options={data?.payload.items || []}
                        getOptionLabel={(el) => el.name}
                        getOptionKey={(el) => el.gid}
                        getOptionDescription={(el) => el.description}
                        onChange={(_, value) =>
                            handleSelectField(value as CustomFieldGroupT)
                        }
                    />
                </>
            )}
        </Stack>
    );
};
