import type { ProjectOutput } from "./backend-schema.gen";
import type { AddEncryptionKeyParams, EncryptionKeyT } from "./encryption";
import type { BasicUserT } from "./user";

export type EncryptionSettingsT = {
    encryption_keys: EncryptionKeyT[];
    users: BasicUserT[];
    encrypt_attachments: boolean;
    encrypt_comments: boolean;
    encrypt_description: boolean;
};

export type EncryptionSettingsCreateT = {
    key: AddEncryptionKeyParams;
    users?: string[];
    encrypt_comments?: boolean;
    encrypt_description?: boolean;
};

export type UpdateEncryptionSettingsT = {
    users: string[];
};

export type BasicProjectT = {
    id: string;
    name: string;
    slug: string;
};

export type CreateProjectT = {
    name: string;
    slug: string;
    description?: string;
    ai_description?: string;
    is_active?: boolean;
    encryption_settings?: EncryptionSettingsCreateT;
};

export type ProjectT = ProjectOutput;

export type UpdateProjectT = {
    name?: string;
    slug?: string;
    description?: string;
    ai_description?: string;
    is_active?: boolean;
    card_fields?: string[];
    encryption_settings?: UpdateEncryptionSettingsT;
};

export type ProjectPermissionTargetT = {
    id: string;
    name: string;
};

export type TargetTypeT = "user" | "group";

export type TargetGroupT = ProjectPermissionTargetT & {
    description: string | null;
};

type RoleT = {
    id: string;
    name: string;
    description: string | null;
};

export type ProjectPermissionT = {
    id: string;
    target_type: TargetTypeT;
    target: BasicUserT | TargetGroupT;
    role: RoleT;
};
