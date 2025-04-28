import { Pagination as MuiPagination } from "@mui/material";
import type { FC } from "react";
import React from "react";
import type { ListQueryParams } from "shared/model/types";

type IQueryPaginationProps = {
    count: number;
    queryParams: ListQueryParams;
    updateQueryParams: (newParams: Partial<ListQueryParams>) => void;
    size?: "small" | "medium" | "large";
};

const QueryPagination: FC<IQueryPaginationProps> = ({
    count,
    queryParams,
    updateQueryParams,
    size = "medium",
}) => {
    const { limit, offset } = queryParams;

    const totalPages = Math.ceil(count / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
        const newOffset = (page - 1) * limit;
        updateQueryParams({ offset: newOffset });
    };

    if (totalPages <= 1) {
        return null;
    }

    return (
        <MuiPagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            variant="outlined"
            shape="rounded"
            size={size}
        />
    );
};

export { QueryPagination };
