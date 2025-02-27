import type { GroupT } from "./group";
import type { BasicUserT } from "./user";

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

export type EnumOptionT = CreateEnumOptionT & {
    uuid: string;
};

export type UpdateEnumOptionT = Partial<CreateEnumOptionT> & {
    option_id: string;
};

// user, group
export type UserOrGroupOptionT = {
    uuid: string;
    type: "user" | "group";
    value: BasicUserT | GroupT;
};

// state
export type CreateStateOptionT = {
    value: string;
    color: string | null;
    is_resolved: boolean;
    is_closed: boolean;
};

export type StateOptionT = CreateStateOptionT & {
    uuid: string;
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

export type VersionOptionT = CreateVersionOptionT & {
    uuid: string;
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

export type EnumFieldT = FieldBaseT & {
    color?: string | null;
};
export type StateFieldT = FieldBaseT & {
    is_resolved: boolean;
    is_closed: boolean;
    color: string;
};

export type VersionFieldT = FieldBaseT & {
    id: string; // TODO: remove this field
    release_date: string | null;
    is_released: boolean;
    is_archived: boolean;
};

export type BasicCustomFieldT = {
    id: string;
    name: string;
    type: CustomFieldTypeT;
};

// TODO: remove 'any' & specify this type
export type CustomFieldValueT =
    | boolean
    | number
    | string
    | null
    | BasicUserT
    | BasicUserT[]
    | EnumFieldT
    | EnumFieldT[]
    | StateFieldT
    | VersionFieldT
    | VersionFieldT[]
    | any;

type CustomFieldTypeMap = {
    string: string;
    enum: EnumFieldT;
    date: string;
    datetime: string;
    state: StateFieldT;
    boolean: boolean;
    integer: number;
    float: number;
    enum_multi: EnumFieldT[];
    user: BasicUserT;
    user_multi: BasicUserT[];
    version: VersionFieldT;
    version_multi: VersionFieldT[];
};

type CustomFieldTypeValuePair = {
    [K in keyof CustomFieldTypeMap]: {
        type: K;
        value: CustomFieldTypeMap[K];
    };
}[keyof CustomFieldTypeMap];

export type CustomFieldBaseT = {
    name: string;
    description: string | null;
    ai_description: string | null;
    type: CustomFieldTypeT;
    is_nullable: boolean;
    label: string;
};

export type CreateCustomFieldT = {
    label: string;
    default_value?: CustomFieldValueT;
    is_nullable: boolean;
};

export type CustomFieldT = CustomFieldBaseT & {
    id: string;
    gid: string;
    default_value: CustomFieldValueT;
    options?: CustomFieldOptionT[];
} & CustomFieldTypeValuePair;

export type UpdateCustomFieldT = Partial<
    CreateCustomFieldT & { default_value: CustomFieldValueT }
>;

// field group
export type CreateCustomFieldGroupT = CustomFieldBaseT;

export type CustomFieldGroupT = {
    gid: string;
    default_value: CustomFieldValueT;
    fields: CustomFieldT[];
} & CustomFieldBaseT;

export type UpdateCustomFieldGroupT = Partial<{
    name: string | null;
    description: string | null;
    ai_description: string | null;
}>;
