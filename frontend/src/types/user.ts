export type UserT = {
    id: string;
    name: string;
    email: string;
    is_admin: boolean;
};

export type CreateUserT = {
    name: string;
    email: string;
    is_admin: boolean;
    is_active: boolean;
};

export type UpdateUserT = Partial<CreateUserT>;
