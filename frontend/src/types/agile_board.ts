export type CreateAgileBoardT = {
    name: string;
    description: string | null;
    query: string | null;
    column_field: string | null;
    columns: string[];
};

export type AgileBoardT = CreateAgileBoardT & {
    id: string;
    description: string | null;
    query: string | null;
    column_field: string | null;
};

export type UpdateAgileBoardT = Partial<CreateAgileBoardT>;
