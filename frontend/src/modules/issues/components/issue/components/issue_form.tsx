import { Box, Button, debounce, TextField, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MarkdownPreview, MDEditor } from "shared/ui";
import type { IssueT, UpdateIssueT } from "shared/model/types";
import { HeadingControls } from "./heading_controls";

export type IssueFormProps = {
    issue: IssueT;
    mode: "view" | "edit";
    onUpdateIssue: (issueValues: UpdateIssueT) => Promise<void>;
    onChangeDisplayMode?: (mode: "view" | "edit") => void;
    onSaveIssue?: () => Promise<void>;
    isDraft?: boolean;
    loading?: boolean;
};

export const IssueForm: FC<IssueFormProps> = ({
    issue,
    mode,
    onUpdateIssue,
    onChangeDisplayMode,
    onSaveIssue,
    loading,
    isDraft,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [subject, setSubject] = useState<string>(issue?.subject || "");
    const [text, setText] = useState<string>(issue?.text || "");

    const debouncedUpdate = useCallback(
        debounce((text: string, subject: string) => {
            onUpdateIssue({ text, subject });
        }, 500),
        [],
    );

    const handleClickSave = useCallback(async () => {
        if (isDraft) {
            if (onSaveIssue) {
                await onSaveIssue();
            }
        } else {
            await onUpdateIssue({ text, subject });
        }
        onChangeDisplayMode?.("view");
    }, [
        isDraft,
        onSaveIssue,
        onUpdateIssue,
        text,
        subject,
        onChangeDisplayMode,
    ]);

    const handleClickCancel = () => {
        if (isDraft) {
            navigate({ to: "/issues" });
        }
        onChangeDisplayMode?.("view");
    };

    useEffect(() => {
        if (isDraft) debouncedUpdate(text, subject);
    }, [text, subject, isDraft, debouncedUpdate]);

    if (mode === "view") {
        return (
            <Box mt={-1}>
                {issue.text ? (
                    <MarkdownPreview text={issue.text} />
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

                {!isDraft && <HeadingControls issue={issue} />}
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
