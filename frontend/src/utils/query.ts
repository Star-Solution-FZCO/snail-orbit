import { useState } from "react";
import type { ListQueryParams } from "types";

export const initialListQueryParams: ListQueryParams = {
    limit: 10,
    offset: 0,
};

const cleanParams = <T>(obj: Partial<T>): Partial<T> => {
    return Object.fromEntries(
        Object.entries(obj).filter(
            ([_, value]) => value !== "" && value !== undefined,
        ),
    ) as Partial<T>;
};

export const useListQueryParams = <T extends ListQueryParams>(
    params: Partial<T> = {},
) => {
    const initialParams: T = {
        ...initialListQueryParams,
        ...cleanParams(params),
    } as T;

    const [queryParams, setQueryParams] = useState<T>(initialParams);

    const updateQueryParams = (newParams: Partial<T>) => {
        setQueryParams(
            (prev) => ({ ...cleanParams({ ...prev, ...newParams }) }) as T,
        );
    };

    const resetQueryParams = () => {
        setQueryParams(initialParams);
    };

    return [queryParams, updateQueryParams, resetQueryParams] as const;
};

export const noLimitListQueryParams: ListQueryParams = {
    limit: 0,
    offset: 0,
};
