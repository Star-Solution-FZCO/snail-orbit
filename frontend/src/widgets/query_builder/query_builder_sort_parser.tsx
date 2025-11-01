import DeleteIcon from "@mui/icons-material/Delete";
import SortIcon from "@mui/icons-material/Sort";
import type { AutocompleteChangeReason } from "@mui/material";
import { IconButton, Stack } from "@mui/material";
import type { FC, SyntheticEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
    ParsedSortObjectT,
    QueryBuilderDataAvailableFieldT,
} from "shared/model/types";
import FieldCard from "shared/ui/fields/field_card/field_card";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";
import { useGetQueryBuilderFilterName } from "./utils/get-query-builder-name";

type QueryBuilderSortParserProps = {
    sort: ParsedSortObjectT;
    availableFields: QueryBuilderDataAvailableFieldT[];
    onChange: (
        sort: ParsedSortObjectT,
        field: QueryBuilderDataAvailableFieldT,
        direction: "asc" | "desc",
    ) => void;
    onDelete: (sort: ParsedSortObjectT) => void;
};

export const QueryBuilderSortParser: FC<QueryBuilderSortParserProps> = (
    props,
) => {
    const { t } = useTranslation();

    const { sort, availableFields, onChange, onDelete } = props;
    const getQueryBuilderFilterName = useGetQueryBuilderFilterName();

    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const fieldCardRef = useRef<HTMLDivElement>(null);

    const currentField = availableFields.find(
        (field) => field.name === sort.name,
    );

    const handleFieldChange = useCallback(
        (
            _event: SyntheticEvent,
            value: QueryBuilderDataAvailableFieldT | null,
            _reason: AutocompleteChangeReason,
        ) => {
            if (value) {
                onChange(sort, value, sort.direction);
                setIsPopoverOpen(false);
            }
        },
        [sort, onChange],
    );

    const handleDirectionToggle = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentField) {
                const newDirection = sort.direction === "asc" ? "desc" : "asc";
                onChange(sort, currentField, newDirection);
            }
        },
        [currentField, sort, onChange],
    );

    const getOptionLabel = useCallback(
        (field: QueryBuilderDataAvailableFieldT) => {
            return getQueryBuilderFilterName(field.name);
        },
        [getQueryBuilderFilterName],
    );

    const isOptionEqualToValue = useCallback(
        (
            a: QueryBuilderDataAvailableFieldT,
            b: QueryBuilderDataAvailableFieldT,
        ) => {
            const aGid = "gid" in a ? a.gid : null;
            const bGid = "gid" in b ? b.gid : null;
            return a.name === b.name && aGid === bGid;
        },
        [],
    );

    const getOptionKey = useCallback(
        (field: QueryBuilderDataAvailableFieldT) => {
            const gid = "gid" in field ? field.gid : null;
            return `${field.name}-${gid || "builtin"}`;
        },
        [],
    );

    const options = useMemo(() => availableFields, [availableFields]);

    const rightAdornment = (
        <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton size="small" onClick={handleDirectionToggle}>
                <SortIcon
                    sx={{
                        transform:
                            sort.direction === "asc"
                                ? "scaleY(-1)"
                                : "scaleY(1)",
                        transition: "transform 0.2s ease-in-out",
                    }}
                    fontSize="small"
                />
            </IconButton>

            <IconButton
                size="small"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(sort);
                }}
            >
                <DeleteIcon fontSize="small" color="error" />
            </IconButton>
        </Stack>
    );

    return (
        <>
            <div ref={fieldCardRef}>
                <FieldCard
                    label={t("queryBuilder.sortAttribute")}
                    value={
                        currentField
                            ? getQueryBuilderFilterName(currentField.name)
                            : t("queryBuilder.sortAttributePlaceholder")
                    }
                    onClick={() => setIsPopoverOpen(true)}
                    rightAdornment={rightAdornment}
                    orientation="vertical"
                />
            </div>

            <FormAutocompletePopover<
                QueryBuilderDataAvailableFieldT,
                false,
                false
            >
                id={`sort-field-popover-${sort.name}`}
                open={isPopoverOpen}
                anchorEl={fieldCardRef.current}
                onClose={() => setIsPopoverOpen(false)}
                options={options}
                value={currentField || null}
                onChange={handleFieldChange}
                getOptionLabel={getOptionLabel}
                isOptionEqualToValue={isOptionEqualToValue}
                getOptionKey={getOptionKey}
            />
        </>
    );
};
