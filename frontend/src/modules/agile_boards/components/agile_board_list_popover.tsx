import { Button } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
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
    const navigate = useNavigate();

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

    const onGoToListClick = useCallback(() => {
        navigate({ to: "/agiles/list" });
    }, [navigate]);

    const bottomSlot = useMemo(() => {
        if (!onGoToListClick) return null;

        return (
            <Link to="/agiles/list">
                <Button fullWidth size="small" onClick={onGoToListClick}>
                    {t("agileBoardListPopover.goToList")}
                </Button>
            </Link>
        );
    }, [onGoToListClick, t]);

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
