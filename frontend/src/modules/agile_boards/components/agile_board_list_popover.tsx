import { Button } from "@mui/material";
import { FormAutocompletePopover } from "components/fields/form_autocomplete/form_autocomplete";
import { memo, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "store";
import { AgileBoardT } from "types";
import { noLimitListQueryParams } from "utils";

type TagListPopoverProps = {
    open: boolean;
    anchorEl?: HTMLElement | null;
    onClose?: () => void;
    onSelect?: (tag: AgileBoardT) => void;
    onGoToListClick?: () => void;
};

type InnerOptionType = {
    label: string;
    id: string;
    original: AgileBoardT;
};

export const AgileBoardListPopover = memo((props: TagListPopoverProps) => {
    const { open, anchorEl, onClose, onSelect, onGoToListClick } = props;

    const { t } = useTranslation();

    const [fetchTags, { data, isLoading }] =
        agileBoardApi.useLazyListAgileBoardQuery();

    const options: InnerOptionType[] = useMemo(() => {
        if (!data || !data.payload || !data.payload.items.length) return [];
        return data.payload.items.map((el) => ({
            label: el.name,
            id: el.id,
            original: el,
        }));
    }, [data]);

    useEffect(() => {
        if (open) fetchTags(noLimitListQueryParams);
    }, [open]);

    const handleChange = useCallback(
        (value: InnerOptionType) => {
            if (onSelect) onSelect(value.original);
        },
        [onSelect],
    );

    const bottomSlot = useMemo(() => {
        if (!onGoToListClick) return null;

        return (
            <Button fullWidth size="small" onClick={onGoToListClick}>
                {t("agileBoardListPopover.goToList")}
            </Button>
        );
    }, [onGoToListClick]);

    return (
        <>
            <FormAutocompletePopover
                onClose={onClose}
                anchorEl={anchorEl}
                id="agile-board-list"
                open={open}
                inputProps={{
                    placeholder: t("agileBoardListPopover.placeholder"),
                }}
                bottomSlot={bottomSlot}
                loading={isLoading}
                getOptionKey={(option) => (option as InnerOptionType).id}
                options={options}
                onChange={(_, value) => handleChange(value as InnerOptionType)}
            />
        </>
    );
});
