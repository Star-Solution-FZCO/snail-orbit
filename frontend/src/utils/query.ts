import { useCallback, useState } from "react";
import type { ListQueryParams } from "types";

export const initialListQueryParams: ListQueryParams = {
    limit: 10,
    offset: 0,
};

const removeUndefined = <T>(obj: Partial<T>): Partial<T> => {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => value !== undefined),
    ) as Partial<T>;
};

export const useParams = <T>(initialParams: T) => {
    const [params, setParams] = useState<T>({
        ...initialParams,
    });

    const updateParams = useCallback((newParams: Partial<T>) => {
        setParams((prev) => ({ ...prev, ...removeUndefined(newParams) }));
    }, []);

    const resetParams = () => {
        setParams({
            ...initialParams,
        });
    };

    return [params, updateParams, resetParams] as const;
};

function createParamsHook<X>(factoryParams: X) {
    return <T extends object>(initialParams: T & Partial<X> = {} as T) =>
        useParams<X & T>({ ...factoryParams, ...initialParams });
}

export const noLimitListQueryParams: ListQueryParams = {
    limit: 0,
    offset: 0,
};

export type PaginationParams = {
    page: number;
    perPage: number;
};

export const usePaginationParams = createParamsHook<PaginationParams>({
    page: 1,
    perPage: 10,
});

export const useListQueryParams = createParamsHook<ListQueryParams>(
    initialListQueryParams,
);
