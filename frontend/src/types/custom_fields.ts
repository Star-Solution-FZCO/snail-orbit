import { GroupT } from "./group";
import { BasicUserT } from "./user";

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

export type CreateEnumOptionT = {
    value: string;
    color: string | null;
};

export type EnumOptionT = {
    uuid: string;
} & CreateEnumOptionT;

export type EnumFieldT = Pick<CreateEnumOptionT, "value" | "color">;

export type UpdateEnumOptionT = {
    option_id: string;
} & Partial<CreateEnumOptionT>;

export type UserOrGroupOptionT = {
    uuid: string;
    type: "user" | "group";
    value: BasicUserT | GroupT;
};

export type StateFieldT = {
    state: string;
    is_resolved: boolean;
    is_closed: boolean;
    color: string;
};

export type CreateStateOptionT = {
    value: string;
    color: string | null;
    is_resolved: boolean;
    is_closed: boolean;
};

export type StateOptionT = {
    uuid: string;
} & CreateStateOptionT;

export type UpdateStateOptionT = {
    option_id: string;
} & Partial<Omit<CreateStateOptionT, "value"> & { state: string }>;

export type CreateVersionOptionT = {
    version: string;
    release_date: string | null;
    is_released: boolean;
    is_archived: boolean;
};

export type VersionOptionT = {
    uuid: string;
} & CreateVersionOptionT;

export type UpdateVersionOptionT = {
    option_id: string;
} & Partial<CreateVersionOptionT>;

export type CustomFieldValueT =
    | boolean
    | number
    | BasicUserT
    | BasicUserT[]
    | CustomFieldT
    | StateFieldT
    | EnumFieldT
    | EnumFieldT[]
    | string
    | any
    | null;

export type CustomFieldOptionT =
    | EnumOptionT
    | StateOptionT
    | UserOrGroupOptionT
    | VersionOptionT;

export type CreateCustomFieldT = {
    name: string;
    description: string | null;
    ai_description: string | null;
    type: CustomFieldTypeT;
    is_nullable: boolean;
    default_value: CustomFieldValueT;
};

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
};

type CustomFieldTypeValuePair = {
    [K in keyof CustomFieldTypeMap]: {
        type: K;
        value: CustomFieldTypeMap[K];
    };
}[keyof CustomFieldTypeMap];

export type CustomFieldT = CreateCustomFieldT & {
    id: string;
    options?: CustomFieldOptionT[];
} & CustomFieldTypeValuePair;

export type UpdateCustomFieldT = Partial<CreateCustomFieldT>;

export type BasicCustomFieldT = {
    id: string;
    name: string;
    type: CustomFieldTypeT;
};
