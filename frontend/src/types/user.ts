export type UserT = {
    id: string;
    name: string;
    email: string;
    is_admin: boolean;
    avatar: string;
};

export type CreateUserT = {
    name: string;
    email: string;
    is_admin: boolean;
    is_active: boolean;
};

export type UpdateUserT = Partial<CreateUserT>;
