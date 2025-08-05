import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { QueryBuilderDataAvailableFieldT } from "shared/model/types";
import { FormAutocompletePopover } from "shared/ui/fields/form_autocomplete/form_autocomplete";
import { useGetQueryBuilderFilterName } from "./utils/get-query-builder-name";
import { isSameOption } from "./utils/is-same-option";

type AddFieldButtonProps = {
    availableFields: QueryBuilderDataAvailableFieldT[];
    onSelected?: (field: QueryBuilderDataAvailableFieldT) => void;
    loading?: boolean;
};

export const AddFieldButton = (props: AddFieldButtonProps) => {
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
                {t("queryBuilder.addCustomFieldButton.add")}
            </Button>

            <FormAutocompletePopover
                id="add-cutom-field-popover"
                anchorEl={anchorEl}
                options={availableFields}
                onClose={() => setAnchorEl(null)}
                onChange={(_, selectedField) =>
                    selectedField &&
                    selectedField &&
                    onSelected?.(
                        Array.isArray(selectedField)
                            ? selectedField[0]
                            : selectedField,
                    )
                }
                open={!!anchorEl}
                loading={loading}
                isOptionEqualToValue={isSameOption}
                getOptionLabel={(option) =>
                    getQueryBuilderFilterName(option.name)
                }
            />
        </>
    );
};
