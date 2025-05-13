import { skipToken } from "@reduxjs/toolkit/query";
import { issueApi, projectApi } from "shared/model";

type UseIssueDataProps = {
    issueId: string;
};

export const useIssueData = (props: UseIssueDataProps) => {
    const { issueId } = props;

    const {
        data: issueData,
        isLoading: isIssueLoading,
        error: issueError,
    } = issueApi.useGetIssueQuery(issueId);

    const {
        data: projectData,
        error: projectError,
        isLoading: isProjectLoading,
    } = projectApi.useGetProjectQuery(
        issueData?.payload?.project?.id ?? skipToken,
    );

    const {
        data: encryptionKeysData,
        error: encryptionKeysError,
        isLoading: isEncryptionKeysLoading,
    } = projectApi.useGetProjectEncryptionKeysQuery(
        projectData?.payload.is_encrypted ? projectData?.payload.id : skipToken,
    );

    const isLoading =
        isIssueLoading || isProjectLoading || isEncryptionKeysLoading;
    const isEncrypted = projectData?.payload.is_encrypted || false;
    const error = issueError || projectError || encryptionKeysError;

    return {
        issue: issueData?.payload,
        project: projectData?.payload,
        encryptionKeys: encryptionKeysData?.payload.items || [],
        isLoading,
        isEncrypted,
        error,
    };
};
