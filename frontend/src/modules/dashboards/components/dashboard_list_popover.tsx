import { Button, Stack, Typography } from "@mui/material";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "shared/model/api/dashboard.api";
import type { DashboardT } from "shared/model/types";
import { Link, UserAvatar } from "shared/ui";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";
import { noLimitListQueryParams } from "shared/utils";

type DashboardListPopoverProps = {
    open: boolean;
    anchorEl?: HTMLElement | null;
    onClose?: () => void;
    onSelect?: (dashboard: DashboardT) => void;
};

export const DashboardListPopover = memo((props: DashboardListPopoverProps) => {
    const { open, anchorEl, onClose, onSelect } = props;

    const { t } = useTranslation();

    const { data, isLoading } = dashboardApi.useListDashboardQuery(
        noLimitListQueryParams,
        { skip: !open },
    );

    const options: DashboardT[] = useMemo(() => {
        if (!data || !data.payload || !data.payload.items.length) return [];
        return data.payload.items;
    }, [data]);

    const rightAdornment = useCallback(
        (el: DashboardT) => (
            <Stack direction="row" alignItems="center" gap={1}>
                <UserAvatar src={el.created_by.avatar} />

                <Typography variant="body2">{el.created_by.name}</Typography>
            </Stack>
        ),
        [],
    );

    const handleChange = useCallback(
        (value: DashboardT | DashboardT[] | null) => {
            if (onSelect && value)
                onSelect(Array.isArray(value) ? value[0] : value);
        },
        [onSelect],
    );

    const bottomSlot = useMemo(() => {
        return (
            <>
                <Link to="/dashboards/create">
                    <Button size="small" fullWidth>
                        {t("dashboards.new")}
                    </Button>
                </Link>

                <Link to="/dashboards/list">
                    <Button size="small" fullWidth>
                        {t("dashboardListPopover.goToList")}
                    </Button>
                </Link>
            </>
        );
    }, [t, onClose]);

    return (
        <>
            <FormAutocompletePopover
                onClose={onClose}
                anchorEl={anchorEl}
                id="dashboard-list"
                open={open}
                inputProps={{
                    placeholder: t("dashboardListPopover.placeholder"),
                }}
                bottomSlot={bottomSlot}
                loading={isLoading}
                getOptionKey={(option) => option.id}
                options={options}
                onChange={(_, value) => handleChange(value)}
                getOptionLabel={(el) => el.name}
                getOptionRightAdornment={rightAdornment}
                getOptionDescription={(el) => el.description}
                getOptionLink={(el) => `/dashboards/${el.id}`}
            />
        </>
    );
});
