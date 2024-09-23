export type CreateGroupT = {
    name: string;
    description: string | null;
};

export type UpdateGroupT = Partial<CreateGroupT>;

export type GroupT = { id: string } & CreateGroupT;
