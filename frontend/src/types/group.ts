export type CreateGroupT = {
    name: string;
    description: string | null;
};

export type UpdateGroupT = Partial<CreateGroupT>;

export type GroupT = { id: string } & CreateGroupT;

export type GroupMemberT = {
    id: string;
    name: string;
    email: string;
};
