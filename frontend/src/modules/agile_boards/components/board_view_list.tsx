import type { FC } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { agileBoardApi } from "shared/model";
import type { AgileBoardT, IssueT } from "shared/model/types";
import { usePaginationParams } from "shared/utils";
import IssuesList from "../../issues/components/list/issues_list";
import { useIssueModalView } from "../../issues/widgets/modal_view/use_modal_view";

type BoardViewListProps = {
    boardData: AgileBoardT;
    query?: string;
};

export const BoardViewList: FC<BoardViewListProps> = (props) => {
    const { boardData, query } = props;

    const { data, refetch } = agileBoardApi.useGetBoardIssuesQuery({
        boardId: boardData.id,
        q: query,
    });
    const { openIssueModal } = useIssueModalView();

    const issues = useMemo(
        () =>
            data?.payload.issues.flatMap((el) =>
                el.flatMap((el) => el.flatMap((el) => el)),
            ) || [],
        [data],
    );

    const [listQueryParams, updateListQueryParams] = usePaginationParams({});

    const rows = useMemo(
        () =>
            issues.slice(
                (listQueryParams.page - 1) * listQueryParams.perPage,
                listQueryParams.page * listQueryParams.perPage,
            ),
        [issues, listQueryParams.page, listQueryParams.perPage],
    );

    const pageCount = useMemo(
        () => Math.ceil(issues.length / listQueryParams.perPage),
        [issues, listQueryParams.perPage],
    );

    const handleIssueRowDoubleClick = useCallback(
        (issue: IssueT) => {
            openIssueModal(issue.id_readable);
        },
        [openIssueModal],
    );

    useEffect(() => {
        refetch();
    }, [boardData, refetch]);

    return (
        <IssuesList
            issues={rows}
            page={listQueryParams.page}
            pageCount={pageCount}
            perPage={listQueryParams.perPage}
            onChangePerPage={(perPage) =>
                updateListQueryParams({ perPage, page: 1 })
            }
            totalCount={issues.length}
            onChangePage={(page) => updateListQueryParams({ page })}
            onIssueRowDoubleClick={handleIssueRowDoubleClick}
        />
    );
};
