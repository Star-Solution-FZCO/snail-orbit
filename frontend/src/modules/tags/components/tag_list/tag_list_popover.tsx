import { LocalOfferOutlined } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { Button, IconButton } from "@mui/material";
import type { ReactNode, SyntheticEvent } from "react";
import { memo, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { tagApi } from "shared/model/api/tag.api";
import type { TagT } from "shared/model/types/tag";
import { ColorAdornment } from "shared/ui/fields/adornments/color_adornment";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";
import { noLimitListQueryParams } from "shared/utils";

type TagListPopoverProps = {
    open: boolean;
    anchorEl?: HTMLElement | null;
    onClose?: () => void;
    onAddNewClick?: () => void;
    onSelect?: (tag: TagT, type: "tag" | "untag" | "edit") => void;
};

type InnerOptionType = {
    label: string;
    id: string;
    original: TagT;
    leftAdornment: ReactNode;
    rightAdornment: ReactNode;
};

export const TagListPopover = memo((props: TagListPopoverProps) => {
    const { open, anchorEl, onClose, onAddNewClick, onSelect } = props;

    const { t } = useTranslation();

    const [fetchTags, { data, isLoading }] = tagApi.useLazyListTagsQuery();

    const handleEditButtonClick = useCallback(
        (e: SyntheticEvent, tag: TagT) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect?.(tag, "edit");
            onClose?.();
        },
        [onSelect, onClose],
    );

    const options: InnerOptionType[] = useMemo(() => {
        if (!data || !data.payload || !data.payload.items.length) return [];

        return data.payload.items.map((el) => ({
            label: el.name,
            id: el.id,
            original: el,
            leftAdornment: (
                <ColorAdornment
                    color={el.color}
                    size="medium"
                    sx={{ mr: 1, my: "auto" }}
                >
                    <LocalOfferOutlined
                        sx={{
                            width: "75%",
                            height: "75%",
                        }}
                    />
                </ColorAdornment>
            ),
            rightAdornment: (
                <IconButton
                    size="small"
                    onClick={(e) => handleEditButtonClick(e, el)}
                >
                    <EditIcon fontSize="small" />
                </IconButton>
            ),
        }));
    }, [data]);

    useEffect(() => {
        if (open) fetchTags(noLimitListQueryParams);
    }, [open]);

    const handleChange = useCallback(
        (value: InnerOptionType) => {
            if (onSelect) onSelect(value.original, "tag");
        },
        [onSelect],
    );

    return (
        <>
            <FormAutocompletePopover
                id="tag-list"
                open={open}
                onClose={onClose}
                anchorEl={anchorEl}
                options={options}
                getOptionKey={(option) => (option as InnerOptionType).id}
                onChange={(_, value) => handleChange(value as InnerOptionType)}
                getOptionLabel={(option) => (option as InnerOptionType).label}
                getOptionDescription={(option) => option.original.description}
                getOptionLeftAdornment={(option) => option.leftAdornment}
                getOptionRightAdornment={(option) => option.rightAdornment}
                inputProps={{
                    placeholder: t("tagList.placeholder"),
                }}
                bottomSlot={
                    <Button
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={onAddNewClick}
                    >
                        {t("tagList.newTagButton")}
                    </Button>
                }
                loading={isLoading}
            />
        </>
    );
});
