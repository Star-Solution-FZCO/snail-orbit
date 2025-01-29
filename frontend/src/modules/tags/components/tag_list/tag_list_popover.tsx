import { LocalOfferOutlined } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import { ColorAdornment } from "components/fields/adornments/color_adornment";
import { FormAutocompletePopover } from "components/fields/form_autocomplete/form_autocomplete";
import { memo, ReactNode, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { tagApi } from "store/api/tag.api";
import { TagT } from "types/tag";
import { useListQueryParams } from "utils";

type TagListPopoverProps = {
    open: boolean;
    anchorEl?: HTMLElement | null;
    onClose?: () => void;
    onAddNewClick?: () => void;
    onSelect?: (tag: TagT) => void;
};

type InnerOptionType = {
    label: string;
    id: string;
    original: TagT;
    leftAdornment: ReactNode;
};

export const TagListPopover = memo((props: TagListPopoverProps) => {
    const { open, anchorEl, onClose, onAddNewClick, onSelect } = props;

    const { t } = useTranslation();
    const [listQueryParams] = useListQueryParams({
        limit: 0,
    });

    const [fetchTags, { data, isLoading }] = tagApi.useLazyListTagsQuery();

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
        }));
    }, [data]);

    useEffect(() => {
        if (open) fetchTags(listQueryParams);
    }, [open, listQueryParams]);

    const handleChange = useCallback(
        (value: InnerOptionType) => {
            if (onSelect) onSelect(value.original);
        },
        [onSelect],
    );

    return (
        <>
            <FormAutocompletePopover
                onClose={onClose}
                anchorEl={anchorEl}
                id="tag-list"
                open={open}
                inputProps={{
                    placeholder: t("tagList.placeholder"),
                }}
                loading={isLoading}
                bottomSlot={
                    <Button
                        fullWidth
                        startIcon={<AddIcon />}
                        onClick={onAddNewClick}
                    >
                        {t("tagList.newTagButton")}
                    </Button>
                }
                getOptionKey={(option) => (option as InnerOptionType).id}
                options={options}
                onChange={(_, value) => handleChange(value as InnerOptionType)}
            />
        </>
    );
});
