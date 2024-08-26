import { useState } from "react";
import { ListQueryParams } from "types";

export const initialListQueryParams: ListQueryParams = {
    limit: 10,
    offset: 0,
};

export const useListQueryParams = (
    initialParams: ListQueryParams = initialListQueryParams,
) => {
    const [queryParams, setQueryParams] =
        useState<ListQueryParams>(initialParams);

    const updateQueryParams = (newParams: Partial<ListQueryParams>) => {
        const updatedParams = { ...queryParams, ...newParams };
        setQueryParams(updatedParams);
    };

    const resetQueryParams = () => {
        setQueryParams(initialParams);
    };

    return [queryParams, updateQueryParams, resetQueryParams] as const;
};
