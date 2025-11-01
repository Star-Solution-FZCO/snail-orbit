import DeleteIcon from "@mui/icons-material/Delete";
import { FormControl, IconButton, InputLabel, MenuItem, Select, Stack } from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { ParsedSortObject, QueryBuilderDataAvailableFieldT } from "shared/model/types";
import { useGetQueryBuilderFilterName } from "./utils/get-query-builder-name";

type QueryBuilderSortParserProps = {
    sort: ParsedSortObject;
    availableFields: QueryBuilderDataAvailableFieldT[];
    onChange: (sort: ParsedSortObject, field: QueryBuilderDataAvailableFieldT, direction: 'asc' | 'desc') => void;
    onDelete: (sort: ParsedSortObject) => void;
};

export const QueryBuilderSortParser: FC<QueryBuilderSortParserProps> = (props) => {
    const { sort, availableFields, onChange, onDelete } = props;
    const { t } = useTranslation();
    const getQueryBuilderFilterName = useGetQueryBuilderFilterName();

    const currentField = availableFields.find(field =>
        field.name === sort.name
    );

    const handleFieldChange = (newFieldId: string) => {
        const selectedField = availableFields.find(field => field.name === newFieldId);
        if (selectedField) {
            onChange(sort, selectedField, sort.direction);
        }
    };

    const handleDirectionChange = (newDirection: 'asc' | 'desc') => {
        if (currentField) {
            onChange(sort, currentField, newDirection);
        }
    };

    return (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id={`sort-field-${sort.name}`}>
                    {t("queryBuilder.sortBy.field")}
                </InputLabel>
                <Select
                    labelId={`sort-field-${sort.name}`}
                    value={currentField ? currentField.name : ""}
                    onChange={(e) => handleFieldChange(e.target.value)}
                    label={t("queryBuilder.sortBy.field")}
                >
                    {availableFields.map((field) => (
                        <MenuItem key={field.name} value={field.name}>
                            {getQueryBuilderFilterName(field.name)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id={`sort-direction-${sort.name}`}>
                    {t("queryBuilder.sortBy.direction")}
                </InputLabel>
                <Select
                    labelId={`sort-direction-${sort.name}`}
                    value={sort.direction}
                    onChange={(e) => handleDirectionChange(e.target.value as 'asc' | 'desc')}
                    label={t("queryBuilder.sortBy.direction")}
                >
                    <MenuItem value="asc">{t("queryBuilder.sortBy.ascending")}</MenuItem>
                    <MenuItem value="desc">{t("queryBuilder.sortBy.descending")}</MenuItem>
                </Select>
            </FormControl>

            <IconButton
                size="small"
                onClick={() => onDelete(sort)}
                color="error"
            >
                <DeleteIcon fontSize="small" />
            </IconButton>
        </Stack>
    );
};