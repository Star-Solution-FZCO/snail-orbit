import AddIcon from "@mui/icons-material/Add";
import { Box, CircularProgress, Container } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import deepmerge from "deepmerge";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi, useAppDispatch } from "shared/model";
import type { IssueT } from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { ErrorHandler, Link } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { toastApiError } from "shared/utils";
import IssueView from "../components/issue/issue_view";

type IssueDraftProps = {
    draftId: string;
};

const IssueDraft: FC<IssueDraftProps> = ({ draftId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { setAction } = useNavbarSettings();

    const dispatch = useAppDispatch();

    const { data, isLoading, error } = issueApi.useGetDraftQuery(draftId);

    const [updateDraft, { isLoading: updateLoading }] =
        issueApi.useUpdateDraftMutation();

    const [createIssue, { isLoading: createLoading }] =
        issueApi.useCreateIssueFromDraftMutation();

    const handleSubmit = useCallback(
        async (formData: IssueUpdate) => {
            await updateDraft({ ...formData, id: draftId })
                .unwrap()
                .catch((error) => {
                    toastApiError(error);
                    return Promise.reject(error);
                });
        },
        [draftId, updateDraft],
    );

    const draft = data?.payload;

    const handleCreateIssue = useCallback(async () => {
        if (!draft?.project) {
            toast.error(t("issues.project.required"));
            throw new Error(t("issues.project.required"));
        }

        await createIssue(draftId)
            .unwrap()
            .then((issue) =>
                navigate({ to: `/issues/${issue.payload.id_readable}` }),
            )
            .catch((error) => {
                toastApiError(error);
                return Promise.reject(error);
            });
    }, [createIssue, draftId, draft?.project, navigate, t]);

    const handleUpdateCache = useCallback(
        (issueValue: Partial<IssueT>) => {
            if (!draft) return;

            dispatch(
                issueApi.util.updateQueryData("getDraft", draft.id, (draft) => {
                    draft.payload = deepmerge(draft.payload, issueValue, {
                        arrayMerge: (_, sourceArray) => sourceArray,
                    });
                }),
            );
        },
        [dispatch, draft],
    );

    useEffect(() => {
        setAction(
            <Link to="/issues/create">
                <NavbarActionButton startIcon={<AddIcon />}>
                    {t("issues.new")}
                </NavbarActionButton>
            </Link>,
        );

        return () => setAction(null);
    }, [setAction, t]);

    if (error) {
        return <ErrorHandler error={error} message="issues.item.fetch.error" />;
    }

    return (
        <Container
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                px: 4,
                pb: 4,
            }}
            disableGutters
        >
            {isLoading ? (
                <Box display="flex" justifyContent="center">
                    <CircularProgress color="inherit" size={36} />
                </Box>
            ) : (
                <>
                    {draft && (
                        <IssueView
                            // @ts-expect-error TODO: Split IssueT and DraftT
                            issue={draft}
                            onUpdateIssue={handleSubmit}
                            onUpdateCache={handleUpdateCache}
                            onSaveIssue={handleCreateIssue}
                            loading={
                                isLoading || updateLoading || createLoading
                            }
                            isDraft
                        />
                    )}
                </>
            )}
        </Container>
    );
};

export { IssueDraft };
