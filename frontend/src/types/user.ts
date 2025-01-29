import type { GroupT } from "./group";

export type BasicUserT = {
    id: string;
    name: string;
    email: string;
    avatar: string;
};

export type UserT = BasicUserT & {
    is_admin: boolean;
    is_active: boolean;
};

export type CreateUserT = {
    name: string;
    email: string;
    is_admin: boolean;
    is_active: boolean;
    send_invite: boolean;
};

export type UpdateUserT = Partial<CreateUserT>;

export type APITokenT = {
    name: string;
    last_digits: string;
    created_at: string;
    expires_at: string | null;
    is_active: boolean;
};

export type NewApiTokenT = {
    token: string;
};

export type TOTPDataT = {
    created_at: string;
    secret: string;
    link: string;
    period: number;
    digits: number;
    digest: string;
};

export type MFASettingsT = {
    is_enabled: boolean;
    totp: { created_at: string | null };
};

export type UserOrGroupT = {
    type: "user" | "group";
    data: BasicUserT | GroupT;
};
