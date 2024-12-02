import { LoadingButton } from "@mui/lab";
import { Box, Button, debounce, TextField, Typography } from "@mui/material";
import { useRouter } from "@tanstack/react-router";
import { MarkdownPreview, MDEditor } from "components";
import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IssueT, UpdateIssueT } from "types";
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
    const { history } = useRouter();

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
            history.go(-1);
        }
        onChangeDisplayMode?.("view");
    };

    useEffect(() => {
        if (isDraft) debouncedUpdate(text, subject);
    }, [text, subject, isDraft]);

    if (mode === "view") {
        return text ? (
            <MarkdownPreview text={text} />
        ) : (
            <Box
                sx={{ cursor: "pointer" }}
                onClick={() => onChangeDisplayMode?.("edit")}
            >
                <Typography color="textSecondary">
                    {t("issues.text.empty")}
                </Typography>
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
                <LoadingButton
                    onClick={handleClickSave}
                    variant="outlined"
                    size="small"
                    loading={loading}
                    disabled={loading || !subject}
                >
                    {t("save")}
                </LoadingButton>

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
