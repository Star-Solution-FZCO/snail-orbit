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

export type MFARequiredErrorT = {
    mfa_required: boolean;
    success: boolean;
};

export type BaseQueryParams = {
    limit: number;
    offset: number;
};

export type ListSelectQueryParams = BaseQueryParams & {
    search?: string;
};

export type ListQueryParams = BaseQueryParams & {
    search?: string;
    q?: string;
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
    error_messages?: string[];
    error_fields?: Record<string, string>;
};

export type ListResponse<T> = ApiResponse<ListPayload<T>>;
