import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import type { FC } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "shared/model";
import type {
    QueryBuilderDataAvailableFieldT,
    QueryBuilderDataFilterT,
    QueryBuilderDto,
} from "shared/model/types";
import { AddFieldButton } from "./add_field_button";
import { QueryBuilderFieldsParser } from "./query_builder_fields_parser";
import { getDefaultValueForField } from "./utils";
import { getOptionId, isSameOption } from "./utils/is-same-option";

type QueryBuilderProps = {
    onChangeQuery?: (queryString: string) => void;
    initialQuery?: string;
};

export const QueryBuilder: FC<QueryBuilderProps> = (props) => {
    const { onChangeQuery, initialQuery = "" } = props;
    const { t } = useTranslation();

    const [filterQueryBuilder, { data: queryBuilderData, isLoading }] =
        issueApi.useLazyFilterQueryBuilderQuery();

    const availableFields = useMemo(() => {
        return queryBuilderData?.payload.available_fields || [];
    }, [queryBuilderData]);

    const activeFilters = useMemo(() => {
        return queryBuilderData?.payload.filters || [];
    }, [queryBuilderData]);

    useEffect(() => {
        if (initialQuery !== queryBuilderData?.payload.query)
            filterQueryBuilder({ query: initialQuery });
    }, [filterQueryBuilder, initialQuery, queryBuilderData]);

    const requestNewQuery = useCallback(
        (filters: QueryBuilderDto["filters"]) => {
            filterQueryBuilder({ filters })
                .unwrap()
                .then((res) => {
                    onChangeQuery?.(res.payload.query);
                });
        },
        [filterQueryBuilder, onChangeQuery],
    );

    const handleNewFieldSelected = useCallback(
        (field: QueryBuilderDataAvailableFieldT) => {
            const newFilters: QueryBuilderDto["filters"] = [...activeFilters];
            newFilters.push(getDefaultValueForField(field));
            requestNewQuery(newFilters);
        },
        [activeFilters, requestNewQuery],
    );

    const handleFieldValueChanged = useCallback(
        (filter: QueryBuilderDataFilterT, value: string | number | boolean) => {
            const newFilters: QueryBuilderDto["filters"] = [
                ...activeFilters.filter((el) => !isSameOption(el, filter)),
            ];
            const newFilter = { ...filter, value };
            newFilters.push(newFilter);
            requestNewQuery(newFilters);
        },
        [activeFilters, requestNewQuery],
    );

    const handleFieldDelete = useCallback(
        (filter: QueryBuilderDataFilterT) => {
            const newFilters: QueryBuilderDto["filters"] = [
                ...activeFilters.filter((el) => !isSameOption(el, filter)),
            ];
            requestNewQuery(newFilters);
        },
        [activeFilters, requestNewQuery],
    );

    return (
        <Stack direction="column" gap={2} px={1} height="100%">
            <Typography fontSize={24} fontWeight="bold">
                {t("queryBuilder.title")}
            </Typography>

            {isLoading || !availableFields || !availableFields.length ? (
                <Box
                    sx={{
                        flexGrow: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {isLoading ? (
                        <CircularProgress />
                    ) : (
                        <Box>{t("queryBuilder.noData")}</Box>
                    )}
                </Box>
            ) : (
                <>
                    <AddFieldButton
                        availableFields={availableFields}
                        loading={isLoading}
                        onSelected={handleNewFieldSelected}
                    />

                    <Stack>
                        {activeFilters.map((filter) => (
                            <QueryBuilderFieldsParser
                                filter={filter}
                                onChange={handleFieldValueChanged}
                                onDelete={handleFieldDelete}
                                key={getOptionId(filter)}
                            />
                        ))}
                    </Stack>
                </>
            )}
        </Stack>
    );
};

export default QueryBuilder;
