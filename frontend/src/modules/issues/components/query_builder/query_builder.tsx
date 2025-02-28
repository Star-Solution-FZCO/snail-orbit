import DeleteIcon from "@mui/icons-material/Delete";
import {
    Box,
    CircularProgress,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import {
    FC,
    SyntheticEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useTranslation } from "react-i18next";
import { customFieldsApi, issueApi } from "store";
import { fieldToFieldValue } from "store/utils/issue";
import type { CustomFieldT } from "types";
import { CustomFieldsParser } from "widgets/issue/CustomFieldsParser/CustomFieldsParser";
import { AddCustomFieldButton } from "./add_custom_field_button";

type QueryBuilderProps = {
    onChangeQuery?: (queryString: string) => void;
    initialQuery?: string;
};

export const QueryBuilder: FC<QueryBuilderProps> = (props) => {
    const { t } = useTranslation();

    const { data, isLoading } = customFieldsApi.useListCustomFieldsQuery();

    const availableFields = useMemo(() => {
        return data?.payload.items;
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

    const [newField, setNewField] = useState<CustomFieldT | undefined>(
        undefined,
    );

    const [buildQuery] = issueApi.useLazyFilterBuildQueryStringQuery();
    const [parseQuery] = issueApi.useLazyFilterParseQueryStringQuery();

    const [selectedFields, setSelectedFields] = useState<
        Record<string, CustomFieldT>
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
                                }) as CustomFieldT,
                        );

                    setSelectedFields(
                        Object.fromEntries(
                            presentedFields.map((el) => [el.name, el]),
                        ),
                    );
                });
        },
        [availableFields],
    );

    useEffect(() => {
        if (initialQuery) syncQuery(initialQuery);
    }, []);

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

    const handleDeleteField = useCallback(
        (e: SyntheticEvent, name: string) => {
            e.stopPropagation();
            e.preventDefault();
            setSelectedFields((fields) => {
                const copy = { ...fields };
                delete copy[name];
                return copy;
            });
        },
        [selectedFields],
    );

    const handleAddField = useCallback(
        (field: CustomFieldT) => {
            setSelectedFields((prev) => ({ ...prev, [field.name]: field }));
            setNewField(field);
        },
        [setSelectedFields],
    );

    const handleUpdateFieldValues = useCallback(
        (fields: Record<string, CustomFieldT>) => {
            setSelectedFields((prev) => ({
                ...prev,
                ...fields,
            }));
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
                    <CustomFieldsParser
                        availableFields={Object.values(selectedFields)}
                        activeFields={selectedFields}
                        onUpdateCache={handleUpdateFieldValues}
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
