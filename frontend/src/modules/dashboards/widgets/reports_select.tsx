import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { forwardRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { reportApi } from "shared/model";
import { useListQueryParams } from "shared/utils";
import useDebouncedState from "shared/utils/hooks/use-debounced-state";

interface ReportsSelectProps {
    value?: string;
    onChange: (value: string) => void;
}

export const ReportsSelect = forwardRef<HTMLDivElement, ReportsSelectProps>(
    ({ value, onChange }, ref) => {
        const { t } = useTranslation();

        const [autocompleteOpen, setAutocompleteOpen] = useState(false);
        const [debouncedSearch, setSearch] = useDebouncedState<string>("");
        const [listQueryParams] = useListQueryParams({
            limit: 100,
        });

        const { data, isLoading } = reportApi.useListReportsQuery({
            ...listQueryParams,
            search: debouncedSearch || undefined,
        });

        const reports = data?.payload?.items || [];
        const selectedReport = reports.find((r) => r.id === value);

        return (
            <Autocomplete
                ref={ref}
                value={selectedReport || null}
                open={autocompleteOpen}
                onOpen={() => setAutocompleteOpen(true)}
                onClose={() => setAutocompleteOpen(false)}
                onChange={(_, newValue) => onChange(newValue?.id || "")}
                onInputChange={(_, newValue) => setSearch(newValue)}
                options={reports}
                getOptionLabel={(option) => option.name}
                filterOptions={(options) => options}
                loading={isLoading}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={t("dashboards.widgets.report.label")}
                        size="small"
                        slotProps={{
                            input: {
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {isLoading ? (
                                            <CircularProgress
                                                color="inherit"
                                                size={20}
                                            />
                                        ) : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            },
                        }}
                    />
                )}
                fullWidth
            />
        );
    },
);

ReportsSelect.displayName = "ReportsSelect";