import { Box, Button, debounce, TextField } from "@mui/material";
import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { IssueDraftT } from "shared/model/types";
import type { IssueDraftUpdate } from "shared/model/types/backend-schema.gen";
import { MDEditor } from "shared/ui";
import { useDraftOperations } from "widgets/issue/api/use_draft_operations";

export type DraftFormProps = {
    draft: IssueDraftT;
    onUpdateDraft: (issueValues: IssueDraftUpdate) => Promise<void>;
    onCreateIssue?: () => Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
};

export const DraftForm: FC<DraftFormProps> = (props) => {
    const { draft, onCreateIssue, onUpdateDraft, loading, onCancel } = props;

    const { t } = useTranslation();

    const { getDraftText } = useDraftOperations({ draftId: draft.id });

    const initialTextLoaded = useRef<boolean>(false);

    const [subject, setSubject] = useState<string>(draft?.subject || "");
    const [text, setText] = useState<string>("");

    const [textLoading, setTextLoading] = useState(true);

    useEffect(() => {
        if (initialTextLoaded.current) return;

        initialTextLoaded.current = true;

        setTextLoading(true);

        getDraftText(draft).then((res) => {
            setText(res || draft.text?.value || "");
            setTextLoading(false);
        });
    }, [getDraftText, draft]);

    const debouncedUpdate = useCallback(
        debounce((text: string, subject: string) => {
            onUpdateDraft({ text: { value: text }, subject });
        }, 500),
        [],
    );

    useEffect(() => {
        debouncedUpdate(text, subject);
    }, [text, subject, debouncedUpdate]);

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
            </Box>

            <MDEditor
                value={text}
                onChange={setText}
                placeholder={t("issues.form.text")}
            />

            <Box display="flex" gap={1}>
                <Button
                    onClick={onCreateIssue}
                    variant="outlined"
                    size="small"
                    loading={loading || textLoading}
                    disabled={loading || textLoading || !subject}
                >
                    {t("save")}
                </Button>

                <Button
                    onClick={onCancel}
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
