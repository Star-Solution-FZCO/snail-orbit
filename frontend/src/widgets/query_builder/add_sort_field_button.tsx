import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { QueryBuilderDataAvailableFieldT } from "shared/model/types";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";
import { useGetQueryBuilderFilterName } from "./utils/get-query-builder-name";

type AddSortFieldButtonProps = {
    availableFields: QueryBuilderDataAvailableFieldT[];
    onSelected?: (field: QueryBuilderDataAvailableFieldT) => void;
    loading?: boolean;
};

export const AddSortFieldButton = (props: AddSortFieldButtonProps) => {
    const { availableFields, onSelected, loading } = props;
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const getQueryBuilderFilterName = useGetQueryBuilderFilterName();

    return (
        <>
            <Button
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                variant="outlined"
            >
                <AddIcon />
                {t("queryBuilder.addSortButton.add")}
            </Button>

            <FormAutocompletePopover
                id="add-sort-field-popover"
                anchorEl={anchorEl}
                options={availableFields}
                onClose={() => setAnchorEl(null)}
                onChange={(_, selectedField) =>
                    selectedField &&
                    onSelected?.(
                        Array.isArray(selectedField)
                            ? selectedField[0]
                            : selectedField,
                    )
                }
                open={!!anchorEl}
                loading={loading}
                isOptionEqualToValue={(option, value) => option.name === value.name}
                getOptionLabel={(option) =>
                    getQueryBuilderFilterName(option.name)
                }
            />
        </>
    );
};