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

export type IssueValueT = string | number | boolean | null | string[];

export type CreateCustomFieldT = {
    name: string;
    type: CustomFieldTypeT;
    is_nullable: boolean;
};

export type CustomFieldT = CreateCustomFieldT & {
    id: string;
    options?: EnumOptionT[];
} & (
        | {
              type: "string" | "enum" | "date" | "datetime";
              value: string;
          }
        | {
              type: "boolean";
              value: boolean;
          }
        | {
              type: "integer" | "float";
              value: number;
          }
        | {
              type: "enum_multi";
              value: string[];
          }
        | {
              type: "user";
              value: UserOptionT;
          }
        | {
              type: "user_multi";
              value: UserOptionT[];
          }
    );

export type UpdateCustomFieldT = Partial<CreateCustomFieldT>;

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

export function isUserOption(option: object): option is UserOptionT {
    return "id" in option;
}

export type UpdateEnumOptionT = {
    option_id: string;
} & Partial<CreateEnumOptionT>;
