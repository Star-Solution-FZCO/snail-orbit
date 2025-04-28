import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { sharedApi } from "shared/model";
import { toastApiError } from "shared/utils";
import { useUploadToastManager } from "./useUploadToastManager";

export const useFileUploader = () => {
    const { t } = useTranslation();

    const mutatorsMap = useRef<
        Map<string, ReturnType<typeof uploadAttachment>>
    >(new Map());

    const handleAbort = useCallback((fileName: string) => {
        const mutator = mutatorsMap.current.get(fileName);
        if (mutator) {
            mutator.abort();
            mutatorsMap.current.delete(fileName);
        }
    }, []);

    const { updateToast, showToast } = useUploadToastManager({
        onAbort: handleAbort,
    });
    const [uploadAttachment] = sharedApi.useUploadAttachmentMutation();

    const uploadFile = useCallback(
        async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);
            showToast(file.name);

            try {
                const mutation = uploadAttachment(formData);
                mutatorsMap.current.set(file.name, mutation);
                const response = await mutation.unwrap();

                return response.payload.id;
            } catch (error: unknown) {
                if (
                    error &&
                    typeof error === "object" &&
                    "name" in error &&
                    error.name !== "AbortError"
                ) {
                    toastApiError(error);
                    updateToast(
                        file.name,
                        t("issues.form.attachments.upload.error"),
                        "error",
                        3000,
                    );
                }
                throw error;
            }
        },
        [showToast, t, updateToast, uploadAttachment],
    );

    return { uploadFile };
};
