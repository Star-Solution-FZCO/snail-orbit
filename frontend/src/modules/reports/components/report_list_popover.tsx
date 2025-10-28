import { Button, Stack, Typography } from "@mui/material";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { reportApi } from "shared/model";
import type { ReportT } from "shared/model/types/report";
import { Link, UserAvatar } from "shared/ui";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";
import { noLimitListQueryParams } from "shared/utils";

type ReportListPopoverProps = {
    open: boolean;
    anchorEl?: HTMLElement | null;
    onClose?: () => void;
    onSelect?: (dashboard: ReportT) => void;
};

export const ReportListPopover = memo((props: ReportListPopoverProps) => {
    const { open, anchorEl, onClose, onSelect } = props;

    const { t } = useTranslation();

    const { data, isLoading } = reportApi.useListReportsQuery(
        noLimitListQueryParams,
        { skip: !open },
    );

    const options: ReportT[] = useMemo(() => {
        if (!data || !data.payload || !data.payload.items.length) return [];
        return data.payload.items;
    }, [data]);

    const rightAdornment = useCallback(
        (el: ReportT) => (
            <Stack direction="row" alignItems="center" gap={1}>
                <UserAvatar src={el.created_by.avatar} />

                <Typography variant="body2">{el.created_by.name}</Typography>
            </Stack>
        ),
        [],
    );

    const handleChange = useCallback(
        (value: ReportT | ReportT[] | null) => {
            if (onSelect && value)
                onSelect(Array.isArray(value) ? value[0] : value);
        },
        [onSelect],
    );

    const bottomSlot = useMemo(() => {
        return (
            <>
                <Link to="/reports/create">
                    <Button size="small" fullWidth>
                        {t("reports.new")}
                    </Button>
                </Link>

                <Link to="/reports/list">
                    <Button size="small" fullWidth>
                        {t("reports.goToList")}
                    </Button>
                </Link>
            </>
        );
    }, [t]);

    return (
        <>
            <FormAutocompletePopover
                onClose={onClose}
                anchorEl={anchorEl}
                id="reports-list"
                open={open}
                inputProps={{
                    placeholder: t("reportsListPopover.placeholder"),
                }}
                bottomSlot={bottomSlot}
                loading={isLoading}
                getOptionKey={(option) => option.id}
                options={options}
                onChange={(_, value) => handleChange(value)}
                getOptionLabel={(el) => el.name}
                getOptionRightAdornment={rightAdornment}
                getOptionDescription={(el) => el.description}
                getOptionLink={(el) => `/reports/${el.id}`}
            />
        </>
    );
});
