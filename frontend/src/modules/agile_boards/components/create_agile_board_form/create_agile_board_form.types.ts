import type { AgileBoardT } from "types";

export type FormValues = Pick<
    AgileBoardT,
    "name" | "description" | "projects"
> &
    Partial<Pick<AgileBoardT, "column_field">>;
