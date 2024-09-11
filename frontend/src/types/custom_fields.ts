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
] as const;

export type CustomFieldTypeT = (typeof customFieldsTypes)[number];

export type CreateEnumOptionT = {
    value: string;
    color: string | null;
};

export type EnumOptionT = {
    uuid: string;
} & CreateEnumOptionT;

export type UserOptionT = {
    id: string;
    email: string;
    name: string;
};

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
} & Partial<CreateStateOptionT>;

export type CustomFieldValueT =
    | BasicUserT
    | BasicUserT[]
    | StateFieldT
    | string
    | any
    | null;

export type CustomFieldOptionT =
    | EnumOptionT
    | StateOptionT
    | UserOrGroupOptionT;

export type CreateCustomFieldT = {
    name: string;
    type: CustomFieldTypeT;
    is_nullable: boolean;
    default_value: CustomFieldValueT;
};

type CustomFieldTypeMap = {
    string: string;
    enum: string;
    date: string;
    datetime: string;
    state: string;
    boolean: boolean;
    integer: number;
    float: number;
    enum_multi: string[];
    user: UserOptionT;
    user_multi: UserOptionT[];
};

type CustomFieldTypeValuePair = {
    [K in keyof CustomFieldTypeMap]: {
        type: K;
        value: CustomFieldTypeMap[K];
    };
}[keyof CustomFieldTypeMap];

export type CustomFieldT = CreateCustomFieldT & {
    id: string;
    options?: EnumOptionT[];
} & CustomFieldTypeValuePair;

export type UpdateCustomFieldT = Partial<CreateCustomFieldT>;
