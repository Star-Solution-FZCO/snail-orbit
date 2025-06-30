import { Button } from "@mui/material";
import type { MouseEventHandler } from "react";
import { memo, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "shared/model";
import type { AgileBoardT } from "shared/model/types";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";
import { useListQueryParams } from "shared/utils";
import { Link, StarButton } from "../../../shared/ui";

type TagListPopoverProps = {
    open: boolean;
    anchorEl?: HTMLElement | null;
    onClose?: () => void;
    onSelect?: (tag: AgileBoardT) => void;
};

export const AgileBoardListPopover = memo((props: TagListPopoverProps) => {
    const { open, anchorEl, onClose, onSelect } = props;
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

    const options: AgileBoardT[] = useMemo(() => {
        if (!data || !data.payload || !data.payload.items.length) return [];
        return data.payload.items;
    }, [data]);

    const rightAdornment = useCallback(
        (el: AgileBoardT) => (
            <StarButton
                size="small"
                starred={el.is_favorite}
                onClick={handleStarClick(el.id, !el.is_favorite)}
            />
        ),
        [handleStarClick],
    );

    useEffect(() => {
        if (open) fetchTags(params);
    }, [fetchTags, open, params]);

    const handleChange = useCallback(
        (value: AgileBoardT | AgileBoardT[] | null) => {
            if (onSelect && value)
                onSelect(Array.isArray(value) ? value[0] : value);
        },
        [onSelect],
    );

    const bottomSlot = useMemo(() => {
        return (
            <>
                <Link to="/agiles/create">
                    <Button fullWidth size="small">
                        {t("New board")}
                    </Button>
                </Link>
                <Link to="/agiles/list">
                    <Button fullWidth size="small">
                        {t("View list")}
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
                id="agile-board-list"
                open={open}
                inputProps={{
                    placeholder: t("agileBoardListPopover.placeholder"),
                }}
                bottomSlot={bottomSlot}
                loading={isLoading}
                getOptionKey={(option) => option.id}
                options={options}
                onChange={(_, value) => handleChange(value)}
                getOptionLabel={(el) => el.name}
                getOptionRightAdornment={rightAdornment}
                getOptionDescription={(el) => el.description}
                getOptionLink={(el) => `/agiles/${el.id}`}
            />
        </>
    );
});
