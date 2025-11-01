import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import type { FC } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "shared/model";
import type {
    ParsedSortObjectT,
    QueryBuilderDataAvailableFieldT,
    QueryBuilderDataFilterT,
    QueryBuilderDto,
    SortObjectT,
} from "shared/model/types";
import { AddFieldButton } from "./add_field_button";
import { AddSortFieldButton } from "./add_sort_field_button";
import { QueryBuilderFieldsParser } from "./query_builder_fields_parser";
import { QueryBuilderSortParser } from "./query_builder_sort_parser";
import { getDefaultSortForField, getDefaultValueForField } from "./utils";
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

    const activeSorts = useMemo(() => {
        return queryBuilderData?.payload.sort_by || [];
    }, [queryBuilderData]);

    const availableSortFields = useMemo(() => {
        return queryBuilderData?.payload.available_sort_fields || [];
    }, [queryBuilderData]);

    useEffect(() => {
        if (initialQuery !== queryBuilderData?.payload.query)
            filterQueryBuilder({ query: initialQuery });
    }, [filterQueryBuilder, initialQuery, queryBuilderData]);

    const requestNewQuery = useCallback(
        (filters: QueryBuilderDto["filters"], sortBy?: SortObjectT[]) => {
            filterQueryBuilder({ filters, sort_by: sortBy })
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
            const currentSortObjects: SortObjectT[] = activeSorts.map(
                (sort) => ({
                    name: sort.name,
                    direction: sort.direction,
                }),
            );
            requestNewQuery(newFilters, currentSortObjects);
        },
        [activeFilters, activeSorts, requestNewQuery],
    );

    const handleFieldValueChanged = useCallback(
        (filter: QueryBuilderDataFilterT, value: string | number | boolean) => {
            const newFilters: QueryBuilderDto["filters"] = [
                ...activeFilters.filter((el) => !isSameOption(el, filter)),
            ];
            const newFilter = { ...filter, value };
            newFilters.push(newFilter);
            const currentSortObjects: SortObjectT[] = activeSorts.map(
                (sort) => ({
                    name: sort.name,
                    direction: sort.direction,
                }),
            );
            requestNewQuery(newFilters, currentSortObjects);
        },
        [activeFilters, activeSorts, requestNewQuery],
    );

    const handleFieldDelete = useCallback(
        (filter: QueryBuilderDataFilterT) => {
            const newFilters: QueryBuilderDto["filters"] = [
                ...activeFilters.filter((el) => !isSameOption(el, filter)),
            ];
            const currentSortObjects: SortObjectT[] = activeSorts.map(
                (sort) => ({
                    name: sort.name,
                    direction: sort.direction,
                }),
            );
            requestNewQuery(newFilters, currentSortObjects);
        },
        [activeFilters, activeSorts, requestNewQuery],
    );

    const handleNewSortSelected = useCallback(
        (field: QueryBuilderDataAvailableFieldT) => {
            const newSorts: ParsedSortObjectT[] = [...activeSorts];
            newSorts.push(getDefaultSortForField(field));
            const currentFilters: QueryBuilderDto["filters"] =
                activeFilters.map((filter) => ({
                    type: filter.type,
                    name: filter.name,
                    gid: filter.gid,
                    value: filter.value,
                }));
            const sortObjects: SortObjectT[] = newSorts.map((sort) => ({
                name: sort.name,
                direction: sort.direction,
            }));
            requestNewQuery(currentFilters, sortObjects);
        },
        [activeSorts, activeFilters, requestNewQuery],
    );

    const handleSortChanged = useCallback(
        (
            sort: ParsedSortObjectT,
            field: QueryBuilderDataAvailableFieldT,
            direction: "asc" | "desc",
        ) => {
            const newSorts: ParsedSortObjectT[] = activeSorts.map((s) =>
                s.name === sort.name && s.direction === sort.direction
                    ? {
                          type: field.type,
                          name: field.name,
                          gid: field.gid,
                          direction,
                      }
                    : s,
            );
            const currentFilters: QueryBuilderDto["filters"] =
                activeFilters.map((filter) => ({
                    type: filter.type,
                    name: filter.name,
                    gid: filter.gid,
                    value: filter.value,
                }));
            const sortObjects: SortObjectT[] = newSorts.map((sortObj) => ({
                name: sortObj.name,
                direction: sortObj.direction,
            }));
            requestNewQuery(currentFilters, sortObjects);
        },
        [activeSorts, activeFilters, requestNewQuery],
    );

    const handleSortDelete = useCallback(
        (sort: ParsedSortObjectT) => {
            const newSorts: ParsedSortObjectT[] = activeSorts.filter(
                (s) =>
                    !(s.name === sort.name && s.direction === sort.direction),
            );
            const currentFilters: QueryBuilderDto["filters"] =
                activeFilters.map((filter) => ({
                    type: filter.type,
                    name: filter.name,
                    gid: filter.gid,
                    value: filter.value,
                }));
            const sortObjects: SortObjectT[] = newSorts.map((sortObj) => ({
                name: sortObj.name,
                direction: sortObj.direction,
            }));
            requestNewQuery(currentFilters, sortObjects);
        },
        [activeSorts, activeFilters, requestNewQuery],
    );

    return (
        <Stack direction="column" gap={1} px={1} height="100%">
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

                    {activeFilters.length > 0 && (
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
                    )}

                    <Stack direction="column" gap={1}>
                        <Typography>
                            {t("queryBuilder.sortedBy.title")}
                        </Typography>

                        <AddSortFieldButton
                            availableFields={availableSortFields}
                            loading={isLoading}
                            onSelected={handleNewSortSelected}
                        />

                        {activeSorts.length > 0 && (
                            <Stack>
                                {activeSorts.map((sort, index) => (
                                    <QueryBuilderSortParser
                                        key={`${sort.name}-${sort.direction}-${index}`}
                                        sort={sort}
                                        availableFields={availableSortFields}
                                        onChange={handleSortChanged}
                                        onDelete={handleSortDelete}
                                    />
                                ))}
                            </Stack>
                        )}
                    </Stack>
                </>
            )}
        </Stack>
    );
};

export default QueryBuilder;
