import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { Button, IconButton } from "@mui/material";
import type { ReactNode, SyntheticEvent } from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { tagApi } from "shared/model/api/tag.api";
import type { TagDto, TagT } from "shared/model/types/tag";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";
import { noLimitListQueryParams } from "shared/utils";
import { TagAdornment } from "./tag_adornment";
import { TagFormDialog } from "./tag_form_dialog";

type TagManagerPopoverProps = {
    open: boolean;
    anchorEl?: HTMLElement | null;
    onClose?: () => void;
    onSelect?: (tag: TagT) => void;
};

type InnerOptionType = {
    label: string;
    id: string;
    original: TagT;
    leftAdornment: ReactNode;
    rightAdornment: ReactNode;
};

export const TagManagerPopover = memo((props: TagManagerPopoverProps) => {
    const { open, anchorEl, onClose, onSelect } = props;

    const { t } = useTranslation();
    const [showForm, setShowForm] = useState<boolean>(false);
    const [tagToEdit, setTagToEdit] = useState<TagT | null>(null);

    const [fetchTags, { data, isLoading: isTagsLoading }] =
        tagApi.useLazyListTagsQuery();

    const [createTag, { isLoading: isTagCreateLoading }] =
        tagApi.useCreateTagMutation();
    const [updateTag, { isLoading: isTagUpdateLoading }] =
        tagApi.useUpdateTagMutation();

    const handleTagCreate = useCallback((data: TagDto) => {
        createTag(data)
            .unwrap()
            .then((resp) => {
                toast.success(t("createTag.successMessage"));
                onSelect?.(resp.payload);
                setShowForm(false);
            });
    }, []);

    const handleTagUpdate = useCallback((data: TagDto & { id: string }) => {
        updateTag(data)
            .unwrap()
            .then(() => {
                toast.success(t("updateTag.successMessage"));
                setShowForm(false);
            });
    }, []);

    useEffect(() => {
        if (open && !showForm) {
            fetchTags(noLimitListQueryParams);
        }
    }, [fetchTags, open, showForm]);

    useEffect(() => {
        if (!open) {
            setShowForm(false);
        }
    }, [open]);

    const handleEditButtonClick = useCallback(
        (e: SyntheticEvent, tag: TagT) => {
            e.preventDefault();
            e.stopPropagation();
            setTagToEdit(tag);
            setShowForm(true);
        },
        [],
    );

    const handleAddNewClick = useCallback(() => {
        setShowForm(true);
    }, []);

    const handleBackToList = useCallback(() => {
        setShowForm(false);
    }, []);

    const options: InnerOptionType[] = useMemo(() => {
        if (!data || !data.payload || !data.payload.items.length) return [];

        return data.payload.items.map((el) => ({
            label: el.name,
            id: el.id,
            original: el,
            leftAdornment: el.color ? <TagAdornment color={el.color} /> : null,
            rightAdornment: (
                <IconButton
                    size="small"
                    onClick={(e) => handleEditButtonClick(e, el)}
                >
                    <EditIcon fontSize="small" />
                </IconButton>
            ),
        }));
    }, [data, handleEditButtonClick]);

    const handleTagSelect = useCallback(
        (value: InnerOptionType) => {
            if (onSelect) onSelect(value.original);
        },
        [onSelect],
    );

    if (showForm) {
        return (
            <TagFormDialog
                open={open}
                onClose={onClose}
                onBackToList={handleBackToList}
                onTagCreate={handleTagCreate}
                onTagUpdate={handleTagUpdate}
                isLoading={isTagCreateLoading || isTagUpdateLoading}
                initialData={tagToEdit}
            />
        );
    }

    return (
        <FormAutocompletePopover
            id="tag-manager"
            open={open}
            onClose={onClose}
            anchorEl={anchorEl}
            options={options}
            getOptionKey={(option) => (option as InnerOptionType).id}
            onChange={(_, value) => handleTagSelect(value as InnerOptionType)}
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
                    onClick={handleAddNewClick}
                >
                    {t("tagList.newTagButton")}
                </Button>
            }
            loading={isTagsLoading}
        />
    );
});

TagManagerPopover.displayName = "TagManagerPopover";
