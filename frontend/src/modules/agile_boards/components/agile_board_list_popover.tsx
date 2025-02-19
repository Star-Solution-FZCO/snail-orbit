import { Button } from "@mui/material";
import { FormAutocompletePopover } from "components/fields/form_autocomplete/form_autocomplete";
import {
    memo,
    MouseEventHandler,
    useCallback,
    useEffect,
    useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "store";
import { AgileBoardT } from "types";
import { useListQueryParams } from "utils";
import { StarButton } from "../../../components/star_button";

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
    const [params] = useListQueryParams();

    const { t } = useTranslation();

    const [fetchTags, { data, isLoading }] =
        agileBoardApi.useLazyListAgileBoardQuery();

    const [favoriteBoard] = agileBoardApi.useFavoriteBoardMutation();

    const handleStarClick = useCallback(
        (boardId: string, star: boolean): MouseEventHandler => {
            return (e) => {
                e.stopPropagation();
                e.preventDefault();
                favoriteBoard({ boardId, favorite: star });
            };
        },
        [],
    );

    const options: InnerOptionType[] = useMemo(() => {
        if (!data || !data.payload || !data.payload.items.length) return [];
        return data.payload.items.map((el) => ({
            label: el.name,
            id: el.id,
            original: el,
            rightAdornment: (
                <StarButton
                    color="warning"
                    size="small"
                    starred={el.is_favorite}
                    onClick={handleStarClick(el.id, !el.is_favorite)}
                />
            ),
        }));
    }, [data]);

    useEffect(() => {
        if (open) fetchTags(params);
    }, [open, params]);

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
