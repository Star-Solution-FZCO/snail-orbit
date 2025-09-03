import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton } from "@mui/material";
import dayjs from "dayjs";
import { DateField } from "entities/custom_fields/date_field";
import { DurationField } from "entities/custom_fields/duration_field";
import { GroupSelectField } from "entities/custom_fields/group_select_field";
import { InputField } from "entities/custom_fields/input_field";
import UserField from "entities/custom_fields/user_field";
import { ProjectField } from "entities/projects/project_field";
import { TagField } from "entities/tag/tag_field";
import { useTranslation } from "react-i18next";
import type { BasicUserT, QueryBuilderDataFilterT } from "shared/model/types";
import type { ShortOptionOutput } from "shared/model/types/backend-schema.gen";
import FieldCard from "shared/ui/fields/field_card/field_card";
import { useGetQueryBuilderFilterName } from "./utils/get-query-builder-name";

type QueryBuilderFieldsParserProps = {
    filter: QueryBuilderDataFilterT;
    onChange: (
        filter: QueryBuilderDataFilterT,
        newValue: string | number | boolean,
    ) => unknown;
    onDelete: (filter: QueryBuilderDataFilterT) => unknown;
};

export const QueryBuilderFieldsParser = (
    props: QueryBuilderFieldsParserProps,
) => {
    const { filter, onChange, onDelete } = props;
    const getQueryBuilderFilterName = useGetQueryBuilderFilterName();
    const { t } = useTranslation();

    const adornment = (
        <IconButton
            size="small"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(filter);
            }}
        >
            <DeleteIcon fontSize="small" color="error" />
        </IconButton>
    );

    // If it has GID that this is a custom field
    if ("gid" in filter && filter.gid) {
        switch (filter.type) {
            case "string":
                return (
                    <InputField
                        label={filter.name}
                        id={filter.gid}
                        value={filter.value || ""}
                        inputMode="text"
                        onChange={(value) => onChange(filter, value)}
                        rightAdornment={adornment}
                    />
                );
            case "date":
            case "datetime": {
                const parsedValue = dayjs(filter.value);
                return (
                    <DateField
                        label={filter.name}
                        id={filter.gid}
                        value={parsedValue.isValid() ? parsedValue : undefined}
                        onChange={(value) => {
                            onChange?.(
                                filter,
                                value.format(
                                    filter.type === "datetime"
                                        ? "YYYY-MM-DDTHH:mm:ss"
                                        : "YYYY-MM-DD",
                                ),
                            );
                        }}
                        type={filter.type === "datetime" ? "datetime" : "date"}
                        rightAdornment={adornment}
                    />
                );
            }
            case "boolean":
                return (
                    <FieldCard
                        label={filter.name}
                        id={filter.gid}
                        value={filter.value ? "+" : "-"}
                        onClick={() => {
                            onChange?.(filter, !filter.value);
                        }}
                        rightAdornment={adornment}
                    />
                );
            case "duration":
                return (
                    <DurationField
                        label={filter.name}
                        id={filter.gid}
                        value={filter.value || undefined}
                        onChange={(val) => {
                            onChange?.(filter, val);
                        }}
                        rightAdornment={adornment}
                    />
                );
            case "integer":
            case "float":
                return (
                    <InputField
                        id={filter.gid}
                        label={filter.name}
                        inputMode={
                            filter.type === "integer" ? "numeric" : "decimal"
                        }
                        value={filter.value?.toString() || ""}
                        onChange={(val) => {
                            onChange?.(filter, Number(val));
                        }}
                        rightAdornment={adornment}
                    />
                );
            case "user":
            case "user_multi":
                return (
                    <UserField
                        id={filter.gid}
                        label={filter.name}
                        value={filter?.value || undefined}
                        onChange={(value) => {
                            onChange?.(filter, (value as BasicUserT).email);
                        }}
                        type="group_field"
                        rightAdornment={adornment}
                    />
                );
            case "version":
            case "enum":
            case "enum_multi":
            case "state":
            case "version_multi":
            case "owned_multi":
            case "owned":
                return (
                    <GroupSelectField
                        gid={filter.gid}
                        label={filter.name}
                        value={filter?.value || undefined}
                        onChange={(value) => {
                            onChange?.(
                                filter,
                                (value as ShortOptionOutput).value,
                            );
                        }}
                        rightAdornment={adornment}
                    />
                );
        }
    }

    // Either way it's reserved field
    switch (filter.type) {
        case "string":
            return (
                <InputField
                    value={filter.value || ""}
                    label={getQueryBuilderFilterName(filter.name)}
                    id={filter.name}
                    inputMode="text"
                    onChange={(value) => onChange(filter, value)}
                    rightAdornment={adornment}
                />
            );
        case "datetime": {
            const parsedValue = dayjs(filter.value);
            return (
                <DateField
                    id={filter.name}
                    label={getQueryBuilderFilterName(filter.name)}
                    value={parsedValue.isValid() ? parsedValue : undefined}
                    onChange={(value) => {
                        onChange?.(filter, value.format("YYYY-MM-DDTHH:mm:ss"));
                    }}
                    type="datetime"
                    rightAdornment={adornment}
                />
            );
        }
        case "user":
            return (
                <UserField
                    id={filter.name}
                    label={getQueryBuilderFilterName(filter.name)}
                    value={filter?.value || undefined}
                    onChange={(value) => {
                        onChange?.(
                            filter,
                            Array.isArray(value)
                                ? value[0]?.email
                                : value.email,
                        );
                    }}
                    type="users"
                    rightAdornment={adornment}
                />
            );
        case "project":
            return (
                <ProjectField
                    label={getQueryBuilderFilterName(filter.name)}
                    value={filter.value || undefined}
                    onChange={(project) => {
                        onChange?.(filter, project.slug);
                    }}
                    rightAdornment={adornment}
                />
            );
        case "hashtag":
            return (
                <FieldCard
                    label={t("Hashtag")}
                    value={getQueryBuilderFilterName(filter.name)}
                    orientation="vertical"
                    rightAdornment={adornment}
                />
            );
        case "tag":
            return (
                <TagField
                    label={getQueryBuilderFilterName(filter.name)}
                    value={filter.value || undefined}
                    onChange={(tag) => {
                        onChange?.(filter, tag.name);
                    }}
                    rightAdornment={adornment}
                />
            );
        default:
            // To be implemented if needed
            console.error("Unknown filter type", filter.type);
            return null;
    }
};
