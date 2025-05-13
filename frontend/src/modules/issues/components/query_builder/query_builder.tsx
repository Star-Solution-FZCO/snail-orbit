import DeleteIcon from "@mui/icons-material/Delete";
import {
    Box,
    CircularProgress,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import type { FC, SyntheticEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { customFieldsApi, issueApi } from "shared/model";
import { fieldToFieldValue } from "shared/model/mappers/issue";
import type { CustomFieldT, CustomFieldWithValueT } from "shared/model/types";
import { CustomFieldsParserV2 } from "widgets/issue/custom_fields_parser_v2/custom_fields_parser_v2";
import { AddCustomFieldButton } from "./add_custom_field_button";

type QueryBuilderProps = {
    onChangeQuery?: (queryString: string) => void;
    initialQuery?: string;
};

export const QueryBuilder: FC<QueryBuilderProps> = (props) => {
    const { t } = useTranslation();

    const { data, isLoading } = customFieldsApi.useListCustomFieldGroupsQuery();

    const availableFields = useMemo(() => {
        return data?.payload.items.flatMap((el) => el.fields as CustomFieldT[]);
    }, [data]);

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
                <QueryBuilderContent
                    {...props}
                    availableFields={availableFields}
                />
            )}
        </Stack>
    );
};

type QueryBuilderContentProps = {
    availableFields: CustomFieldT[];
} & QueryBuilderProps;

const QueryBuilderContent: FC<QueryBuilderContentProps> = ({
    onChangeQuery,
    initialQuery,
    availableFields,
}) => {
    const stackRef = useRef<HTMLDivElement>(null);

    const [newField, setNewField] = useState<CustomFieldWithValueT | undefined>(
        undefined,
    );

    const [buildQuery] = issueApi.useLazyFilterBuildQueryStringQuery();
    const [parseQuery] = issueApi.useLazyFilterParseQueryStringQuery();

    const [selectedFields, setSelectedFields] = useState<
        Record<string, CustomFieldWithValueT>
    >({});

    const syncQuery = useCallback(
        (query: string) => {
            if (!query) return setSelectedFields({});
            parseQuery({ query })
                .unwrap()
                .then((res) => {
                    const fieldValueMap = new Map(
                        res.payload.filters.map((el) => [
                            el.field.name,
                            el.value,
                        ]),
                    );
                    const presentedFields = availableFields
                        .filter((el) => fieldValueMap.has(el.name))
                        .map(
                            (el) =>
                                ({
                                    ...el,
                                    value: fieldValueMap.get(el.name),
                                }) as CustomFieldWithValueT,
                        );

                    setSelectedFields(
                        Object.fromEntries(
                            presentedFields.map((el) => [el.name, el]),
                        ),
                    );
                });
        },
        [availableFields, parseQuery],
    );

    useEffect(() => {
        if (initialQuery) syncQuery(initialQuery);
    }, []); // Intentionally left blank

    useEffect(() => {
        if (newField && selectedFields[newField.name] && stackRef.current) {
            const element = stackRef.current.querySelector(
                `[data-field-card-id="${newField.id}"]`,
            );
            setNewField(undefined);
            if (
                element &&
                "click" in element &&
                typeof element.click === "function"
            )
                element.click();
        }
    }, [selectedFields, newField]);

    const availableToAddFields = useMemo(() => {
        if (!availableFields) return [];
        return availableFields.filter(
            (field) => selectedFields[field.name] === undefined,
        );
    }, [availableFields, selectedFields]);

    const handleDeleteField = useCallback((e: SyntheticEvent, name: string) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedFields((fields) => {
            const copy = { ...fields };
            delete copy[name];
            return copy;
        });
    }, []);

    const handleAddField = useCallback(
        (field: CustomFieldT) => {
            const addedField: CustomFieldWithValueT = { ...field, value: null };
            setSelectedFields((prev) => ({
                ...prev,
                [field.name]: addedField,
            }));
            setNewField(addedField);
        },
        [setSelectedFields],
    );

    useEffect(() => {
        if (!onChangeQuery || !selectedFields) return;
        const mappedFields = Object.values(selectedFields)
            .filter((el) => el.value !== undefined)
            .map((el) => ({
                field: el.name,
                value: fieldToFieldValue(el),
            }));
        buildQuery({ filters: mappedFields })
            .unwrap()
            .then((data) => onChangeQuery(data.payload.query));
    }, [buildQuery, selectedFields, onChangeQuery]);

    return (
        <>
            {Object.keys(selectedFields).length ? (
                <Stack direction="column" gap={0} mx={-1} ref={stackRef}>
                    <CustomFieldsParserV2
                        fields={Object.values(selectedFields)}
                        onChange={(field) =>
                            setSelectedFields((prev) => ({
                                ...prev,
                                [field.name]: field,
                            }))
                        }
                        rightAdornmentRenderer={(field) => (
                            <IconButton
                                onClick={(e) =>
                                    handleDeleteField(e, field.name)
                                }
                            >
                                <DeleteIcon color="error" />
                            </IconButton>
                        )}
                    />
                </Stack>
            ) : null}

            <AddCustomFieldButton
                fields={availableToAddFields}
                onSelected={handleAddField}
            />
        </>
    );
};
