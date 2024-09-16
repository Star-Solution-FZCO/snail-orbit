type ApiFieldError = {
    loc: string[];
    ctx: { [key: string]: string | number };
    msg: string;
    type: string;
};

export type QueryErrorT = {
    status: number;
    data: {
        detail: ApiFieldError[];
        type?: string;
    };
};

export type BaseQueryParams = {
    limit: number;
    offset: number;
};

export type ListSelectQueryParams = BaseQueryParams & {
    search?: string | null;
};

export type ListQueryParams = BaseQueryParams & {
    sort_by?: string | null;
    direction?: "asc" | "desc";
};

export type ListPayload<T> = {
    count: number;
    limit: number;
    offset: number;
    items: T[];
};

export type ApiResponse<T> = {
    success: boolean;
    payload: T;
    metadata?: any;
};

export type ListResponse<T> = ApiResponse<ListPayload<T>>;
