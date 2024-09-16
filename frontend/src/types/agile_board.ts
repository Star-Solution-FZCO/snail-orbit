export type CreateAgileBoardT = {
    name: string;
    description: string | null;
    query: string | null;
    column_field: string | null;
    columns: string[];
    projects: string[];
};

export type AgileBoardT = Omit<CreateAgileBoardT, "projects"> & {
    id: string;
    description: string | null;
    query: string | null;
    column_field: string | null;
    projects: { id: string; name: string; slug: string }[];
};

export type UpdateAgileBoardT = Partial<CreateAgileBoardT>;
