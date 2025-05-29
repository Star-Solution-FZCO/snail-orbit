import type {
    CustomFieldGroupLinkOutput,
    CustomFieldGroupOutputRootModel,
    CustomFieldOutputRootModel,
    CustomFieldValueOutputRootModel,
    EnumCustomFieldOutput,
    EnumCustomFieldValueOutput,
    EnumOption,
    EnumOptionOutput,
    StateOption,
    StateOptionOutput,
    UserOptionOutput,
    VersionOption,
    VersionOptionOutput,
} from "./backend-schema.gen";

// types
export const customFieldsTypes = [
    "string",
    "integer",
    "float",
    "boolean",
    "date",
    "datetime",
    "user",
    "user_multi",
    "enum",
    "enum_multi",
    "state",
    "version",
    "version_multi",
] as const;

export type CustomFieldTypeT = (typeof customFieldsTypes)[number];

// options
// enum
export type CreateEnumOptionT = {
    value: string;
    color: string | null;
};

export type UpdateEnumOptionT = Partial<CreateEnumOptionT> & {
    option_id: string;
};

// state
export type CreateStateOptionT = {
    value: string;
    color: string | null;
    is_resolved: boolean;
    is_closed: boolean;
};

export type UpdateStateOptionT = Partial<CreateStateOptionT> & {
    option_id: string;
};

// version
export type CreateVersionOptionT = {
    value: string;
    release_date: string | null;
    is_released: boolean;
    is_archived: boolean;
};

export type UpdateVersionOptionT = Partial<CreateVersionOptionT> & {
    option_id: string;
};

export type CustomFieldOptionT =
    | EnumOptionT
    | StateOptionT
    | UserOrGroupOptionT
    | VersionOptionT;

// fields
export type FieldBaseT = {
    value: string;
    is_archived: boolean;
};

export type EnumOptionT = EnumOptionOutput;
export type EnumFieldValueT = EnumOption;

export type StateOptionT = StateOptionOutput;
export type StateFieldValueT = StateOption;

export type VersionOptionT = VersionOptionOutput;
export type VersionFieldValueT = VersionOption;

export type UserOrGroupOptionT = UserOptionOutput;

export type BasicCustomFieldT = {
    id: string;
    name: string;
    type: CustomFieldTypeT;
};

export type CreateCustomFieldT = {
    label: string;
    default_value?: CustomFieldValueT;
    is_nullable: boolean;
};

export type CustomFieldT = CustomFieldOutputRootModel;

export type CustomFieldGroupLinkT = CustomFieldGroupLinkOutput;

export type CustomFieldWithValueT = CustomFieldValueOutputRootModel;

export type EnumCustomFieldT = EnumCustomFieldOutput;

export type EnumCustomFieldWithValueT = EnumCustomFieldValueOutput;

export type CustomFieldValueT =
    | string
    | string[]
    | number
    | number[]
    | null
    | undefined
    | boolean;

export type UpdateCustomFieldT = Partial<
    CreateCustomFieldT & { default_value: CustomFieldValueT }
>;

export type CustomFieldGroupT = CustomFieldGroupOutputRootModel;

export type UpdateCustomFieldGroupT = Partial<{
    name: string | null;
    description: string | null;
    ai_description: string | null;
}>;
