import { useState } from "react";
import { ListQueryParams } from "types";

export const initialListQueryParams: ListQueryParams = {
    limit: 10,
    offset: 0,
};

export const useListQueryParams = <T extends ListQueryParams>(
    params: Partial<T> = {},
) => {
    const initialParams: T = {
        ...initialListQueryParams,
        ...params,
    } as T;

    const [queryParams, setQueryParams] = useState<T>(initialParams);

    const updateQueryParams = (newParams: Partial<T>) => {
        setQueryParams((prev) => ({ ...prev, ...newParams }));
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
