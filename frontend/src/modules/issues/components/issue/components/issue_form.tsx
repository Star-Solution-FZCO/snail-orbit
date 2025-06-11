import { Box, Button, TextField, Typography } from "@mui/material";
import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { IssueT } from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { MarkdownPreview, MDEditor } from "shared/ui";
import { useIssueOperations } from "widgets/issue/api/use_issue_operations";
import { HeadingControls } from "./heading_controls";

export type IssueFormProps = {
    issue: IssueT;
    mode: "view" | "edit";
    onUpdateIssue: (issueValues: IssueUpdate) => Promise<void>;
    onChangeDisplayMode?: (mode: "view" | "edit") => unknown;
    loading?: boolean;
};

export const IssueForm: FC<IssueFormProps> = ({
    issue,
    mode,
    onUpdateIssue,
    onChangeDisplayMode,
    loading,
}) => {
    const { t } = useTranslation();

    const { getIssueText } = useIssueOperations({ issueId: issue.id });

    const [subject, setSubject] = useState<string>(issue?.subject || "");
    const [text, setText] = useState<string>("");
    const [textLoading, setTextLoading] = useState(true);

    useEffect(() => {
        setTextLoading(true);
        getIssueText(issue).then((res) => {
            setText(res || issue.text?.value || "");
            setTextLoading(false);
        });
    }, [issue, getIssueText]);

    const handleClickSave = useCallback(async () => {
        await onUpdateIssue({ text: { value: text }, subject });

        onChangeDisplayMode?.("view");
    }, [onUpdateIssue, text, subject, onChangeDisplayMode]);

    const handleClickCancel = () => {
        onChangeDisplayMode?.("view");
    };

    if (mode === "view") {
        return (
            <Box mt={-1}>
                {text || textLoading ? (
                    <MarkdownPreview text={text || t("Wait a little...")} />
                ) : (
                    <Box
                        sx={{ cursor: "pointer" }}
                        onClick={() => onChangeDisplayMode?.("edit")}
                    >
                        <Typography color="textSecondary">
                            {t("issues.text.empty")}
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    }

    return (
        <>
            <Box display="flex" alignItems="center" gap={1}>
                <TextField
                    label={t("issues.form.subject")}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    variant="outlined"
                    size="small"
                    fullWidth
                />

                <HeadingControls issue={issue} />
            </Box>

            <MDEditor
                value={text}
                onChange={setText}
                placeholder={t("issues.form.text")}
            />

            <Box display="flex" gap={1}>
                <Button
                    onClick={handleClickSave}
                    variant="outlined"
                    size="small"
                    loading={loading}
                    disabled={loading || !subject}
                >
                    {t("save")}
                </Button>

                <Button
                    onClick={handleClickCancel}
                    color="error"
                    variant="outlined"
                    size="small"
                >
                    {t("cancel")}
                </Button>
            </Box>
        </>
    );
};
