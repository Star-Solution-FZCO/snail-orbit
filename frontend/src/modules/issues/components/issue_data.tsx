import { LoadingButton } from "@mui/lab";
import { Box, debounce, TextField } from "@mui/material";
import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MDEditor } from "../../../components";
import { IssueT, UpdateIssueT } from "../../../types";

export type IssueDataProps = {
    issue: IssueT;
    loading?: boolean;
    onUpdateIssue: (issueValues: UpdateIssueT) => Promise<void>;
    onSaveIssue?: () => Promise<void>;
    isDraft?: boolean;
};

export const IssueData: FC<IssueDataProps> = ({
    issue,
    loading,
    isDraft,
    onUpdateIssue,
    onSaveIssue,
}) => {
    const { t } = useTranslation();
    const [subject, setSubject] = useState<string>(issue?.subject || "");
    const [text, setText] = useState<string>(issue?.text || "");

    const debouncedUpdate = useCallback(
        debounce((text: string, subject: string) => {
            onUpdateIssue({ text, subject });
        }, 300),
        [],
    );

    const handleSave = useCallback(() => {
        if (isDraft) onSaveIssue?.();
        else
            onUpdateIssue({
                text,
                subject,
            });
    }, [isDraft]);

    useEffect(() => {
        if (isDraft) debouncedUpdate(text, subject);
    }, [text, subject, isDraft]);

    return (
        <>
            <TextField
                label={t("issues.form.subject")}
                variant="outlined"
                size="small"
                fullWidth
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
            />

            <MDEditor
                value={text}
                onChange={setText}
                placeholder={t("issues.form.text")}
            />

            <Box display="flex" gap={1}>
                <LoadingButton
                    type="submit"
                    variant="outlined"
                    size="small"
                    loading={loading}
                    disabled={loading || !subject}
                    onClick={handleSave}
                >
                    {t("save")}
                </LoadingButton>
            </Box>
        </>
    );
};
