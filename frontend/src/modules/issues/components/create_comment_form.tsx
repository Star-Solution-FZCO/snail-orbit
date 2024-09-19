import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
import {
    Avatar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
} from "@mui/material";
import { MDEditor } from "components";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { issueApi, useAppSelector } from "store";
import { toastApiError } from "utils";

const UserAvatar: FC = () => {
    const user = useAppSelector((state) => state.profile.user);
    return (
        <Avatar sx={{ width: 32, height: 32, mt: 0.5 }} src={user?.avatar} />
    );
};

interface IUnsavedChangesDialogProps {
    open: boolean;
    onClose: () => void;
    onDiscard: () => void;
}

const UnsavedChangesDialog: FC<IUnsavedChangesDialogProps> = ({
    open,
    onClose,
    onDiscard,
}) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {t("issues.comments.unsavedChanges.title")}

                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {t("issues.comments.unsavedChanges.warning")}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined" color="error">
                    {t("cancel")}
                </Button>
                <Button onClick={onDiscard} variant="outlined">
                    {t("issues.comments.unsavedChanges.discard")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

interface ICreateCommentFormProps {
    issueId: string;
}

const CreateCommentForm: FC<ICreateCommentFormProps> = ({ issueId }) => {
    const { t } = useTranslation();

    const [mode, setMode] = useState<"view" | "edit">("view");
    const [text, setText] = useState<string>("");
    const [discardChangesDialogOpen, setDiscardChangesDialogOpen] =
        useState(false);

    const [createComment, { isLoading }] =
        issueApi.useCreateIssueCommentMutation();

    const handleClickAddComment = () => {
        createComment({
            id: issueId,
            text,
        })
            .unwrap()
            .then(() => {
                setText("");
                setMode("view");
            })
            .catch(toastApiError);
    };

    const handleClickCancel = () => {
        if (text) setDiscardChangesDialogOpen(true);
        else setMode("view");
    };

    const handleDiscardChanges = () => {
        setText("");
        setDiscardChangesDialogOpen(false);
        setMode("view");
    };

    if (mode === "view")
        return (
            <Box display="flex" gap={1}>
                <UserAvatar />

                <TextField
                    onClick={() => setMode("edit")}
                    placeholder={t("issues.comments.write")}
                    variant="outlined"
                    size="small"
                    fullWidth
                />
            </Box>
        );

    if (mode === "edit")
        return (
            <Box display="flex" gap={1}>
                <UserAvatar />

                <Box display="flex" flexDirection="column" gap={1} flex={1}>
                    <Box minHeight="85px">
                        <MDEditor
                            value={text}
                            onChange={(value) => setText(value || "")}
                            textareaProps={{
                                placeholder: t("issues.comments.write"),
                            }}
                            height="100%"
                            minHeight={74}
                            autoFocus
                        />
                    </Box>

                    <Box display="flex" gap={1}>
                        <LoadingButton
                            onClick={handleClickAddComment}
                            variant="outlined"
                            size="small"
                            disabled={!text}
                            loading={isLoading}
                        >
                            {t("issues.comments.add")}
                        </LoadingButton>

                        <Button
                            onClick={handleClickCancel}
                            variant="outlined"
                            size="small"
                            color="error"
                        >
                            {t("cancel")}
                        </Button>
                    </Box>
                </Box>

                <UnsavedChangesDialog
                    open={discardChangesDialogOpen}
                    onClose={() => setDiscardChangesDialogOpen(false)}
                    onDiscard={handleDiscardChanges}
                />
            </Box>
        );
};

export { CreateCommentForm };
