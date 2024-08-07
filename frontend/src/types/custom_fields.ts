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
] as const;

export type CustomFieldTypeT = (typeof customFieldsTypes)[number];

export type CreateCustomFieldT = {
    name: string;
    type: CustomFieldTypeT;
    is_nullable: boolean;
};

export type CustomFieldT = CreateCustomFieldT & {
    id: string;
    options?: EnumOptionT[];
};

export type UpdateCustomFieldT = Partial<CreateCustomFieldT>;

export type CreateEnumOptionT = {
    value: string;
    color: string | null;
};

export type EnumOptionT = {
    uuid: string;
} & CreateEnumOptionT;

export type UpdateEnumOptionT = {
    option_id: string;
} & Partial<CreateEnumOptionT>;
