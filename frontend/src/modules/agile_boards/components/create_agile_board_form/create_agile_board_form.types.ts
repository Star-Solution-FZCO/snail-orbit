import type { AgileBoardT } from "shared/model/types";

export type FormValues = Pick<
    AgileBoardT,
    "name" | "description" | "projects"
> &
    Partial<Pick<AgileBoardT, "column_field">>;
