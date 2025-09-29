import { reportApi } from "shared/model";
import { useListQueryParams } from "shared/utils";
import useDebouncedState from "shared/utils/hooks/use-debounced-state";

export const ReportsSelect = () => {
    const [debouncedSearch, setSearch, search] = useDebouncedState<string>("");
    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const { data } = reportApi.useListReportsQuery({
        ...listQueryParams,
        search: debouncedSearch,
    });

    const reports = data?.payload?.items || [];

    return null;
};
