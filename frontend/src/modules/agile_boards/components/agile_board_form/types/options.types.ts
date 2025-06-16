import type {
    ShortOptionOutput,
    UserOutput,
} from "shared/model/types/backend-schema.gen";

export type OptionT =
    | UserOutput
    | ShortOptionOutput
    | string
    | number
    | boolean;
