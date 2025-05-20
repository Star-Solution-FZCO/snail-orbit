import { skipToken } from "@reduxjs/toolkit/query";
import { projectApi } from "../../../shared/model";

export const useProjectData = (props: { projectId?: string }) => {
    const { projectId } = props;

    const {
        data: projectData,
        error: projectError,
        isLoading: isProjectLoading,
    } = projectApi.useGetProjectQuery(projectId ?? skipToken);

    const {
        data: encryptionKeysData,
        error: encryptionKeysError,
        isLoading: isEncryptionKeysLoading,
    } = projectApi.useGetProjectEncryptionKeysQuery(
        projectData?.payload.is_encrypted ? projectData?.payload.id : skipToken,
    );

    const isLoading = isProjectLoading || isEncryptionKeysLoading;
    const isEncrypted = projectData?.payload.is_encrypted || false;
    const error = projectError || encryptionKeysError;

    return {
        project: projectData?.payload,
        encryptionKeys: encryptionKeysData?.payload.items || [],
        isLoading,
        isEncrypted,
        error,
    };
};
