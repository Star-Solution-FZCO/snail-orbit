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
