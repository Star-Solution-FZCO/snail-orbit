import { useCallback, useState } from "react";
import type { ListQueryParams } from "shared/model/types";
import { removeUndefined } from "./helpers/remove-undefined";

export const defaultLimit = 25;

export const perPageOptions = [10, 25, 50, 100, 500];

export const initialListQueryParams: ListQueryParams = {
    limit: defaultLimit,
    offset: 0,
};

export const useParams = <T>(initialParams: T) => {
    const [params, setParams] = useState<T>({
        ...initialParams,
    });

    const updateParams = useCallback(
        (value: Partial<T> | ((oldValues: T) => Partial<T>)) => {
            if (typeof value === "function") {
                setParams((oldValues) => ({
                    ...oldValues,
                    ...removeUndefined(value(oldValues)),
                }));
                return;
            } else {
                setParams((prev) => ({ ...prev, ...removeUndefined(value) }));
            }
        },
        [],
    );

    const resetParams = useCallback(() => {
        setParams({
            ...initialParams,
        });
    }, []);

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
    perPage: defaultLimit,
});

export const useListQueryParams = createParamsHook<ListQueryParams>(
    initialListQueryParams,
);
