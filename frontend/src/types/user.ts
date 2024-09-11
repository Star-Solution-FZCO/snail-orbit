export type BasicUserT = {
    id: string;
    name: string;
    email: string;
};

export type UserT = BasicUserT & {
    is_admin: boolean;
    avatar: string;
    origin: "local" | "wb";
};

export type CreateUserT = {
    name: string;
    email: string;
    is_admin: boolean;
    is_active: boolean;
};

export type UpdateUserT = Partial<CreateUserT>;
