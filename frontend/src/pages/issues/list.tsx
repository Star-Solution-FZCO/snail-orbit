import { CircularProgress, Stack, Typography } from "@mui/material";
import { IssueSearchSelect } from "modules/issues/components/issue/components/issue_project_select";
import { SearchField } from "modules/issues/components/issue/components/search_field";
import IssuesList from "modules/issues/components/list/issues_list";
import { useCreateIssueNavbarSettings } from "modules/issues/hooks/use-create-issue-navbar-settings";
import { useIssueModalView } from "modules/issues/widgets/modal_view/use_modal_view";
import type { FC } from "react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "shared/model";
import type { IssueT, ProjectT } from "shared/model/types";
import { defaultLimit, formatErrorMessages, useParams } from "shared/utils";

export type IssueListQueryParams = {
    page?: number;
    perPage?: number;
    query?: string;
};

export type IssueListProps = {
    queryParams?: IssueListQueryParams;
    onQueryParamsChanged?: (params: Partial<IssueListQueryParams>) => unknown;
    listId?: string;
    onChangeListId?: (id: string) => unknown;
};

const IssueList: FC<IssueListProps> = (props) => {
    const { queryParams, onQueryParamsChanged, listId, onChangeListId } = props;

    const { t } = useTranslation();
    const { openIssueModal } = useIssueModalView();

    useCreateIssueNavbarSettings();

    const [listQueryParams, updateListQueryParams] = useParams({
        perPage: queryParams?.perPage ?? defaultLimit,
        page: queryParams?.page ?? 1,
        query: queryParams?.query || "",
    });

    const splitListId = useMemo(() => {
        if (!listId) return [];
        return listId.split(",").map((el) => el.trim());
    }, [listId]);

    const totalQuery = useMemo(() => {
        const parts = [
            splitListId?.length
                ? `(${splitListId.map((el) => `project: ${el}`).join(" or ")})`
                : undefined,
            listQueryParams.query,
        ];
        return parts.filter((el) => !!el).join(" and ");
    }, [listQueryParams.query, splitListId]);

    const { data, isFetching, error, isLoading } = issueApi.useListIssuesQuery({
        limit: listQueryParams.perPage,
        offset: (listQueryParams.page - 1) * listQueryParams.perPage,
        q: totalQuery,
    });

    const handleUpdateParams = useCallback(
        (search: Partial<typeof listQueryParams>) => {
            updateListQueryParams(search);
            onQueryParamsChanged?.(search);
        },
        [],
    );

    const handleIssueRowDoubleClick = useCallback(
        (issue: IssueT) => {
            openIssueModal(issue.id_readable);
        },
        [openIssueModal],
    );

    const handleIssueSearchSelectChange = useCallback(
        (projects: ProjectT[]) => {
            if (projects)
                onChangeListId?.(projects.map((el) => el.slug).join(","));
            else onChangeListId?.("");
        },
        [onChangeListId],
    );

    const rows = data?.payload.items || [];

    return (
        <Stack direction="column" id="mainContent" gap={2} height={1} px={4}>
            <Stack direction="row" gap={1}>
                <IssueSearchSelect
                    selectedProjectSlug={splitListId}
                    onChange={handleIssueSearchSelectChange}
                />

                <SearchField
                    value={listQueryParams?.query || ""}
                    onChange={(query) => handleUpdateParams({ query })}
                    loading={isFetching}
                />
            </Stack>

            {error && (
                <Typography color="error" fontSize={16}>
                    {formatErrorMessages(error) || t("issues.list.fetch.error")}
                    !
                </Typography>
            )}

            {isLoading ? (
                <CircularProgress />
            ) : (
                <IssuesList
                    issues={rows}
                    page={listQueryParams.page}
                    pageCount={Math.ceil(
                        (data?.payload.count || 0) / listQueryParams.perPage,
                    )}
                    onChangePage={(page) => handleUpdateParams({ page })}
                    onChangePerPage={(perPage) =>
                        handleUpdateParams({ perPage, page: 1 })
                    }
                    onIssueRowDoubleClick={handleIssueRowDoubleClick}
                    totalCount={data?.payload.count}
                    perPage={listQueryParams.perPage}
                />
            )}
        </Stack>
    );
};

export { IssueList };
