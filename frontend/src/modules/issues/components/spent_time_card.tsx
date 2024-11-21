import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, SxProps, Theme, Tooltip, Typography } from "@mui/material";
import { UserAvatar } from "components";
import dayjs from "dayjs";
import { t } from "i18next";
import { FC } from "react";
import { useAppSelector } from "store";
import { IssueSpentTimeRecordT } from "types";
import { formatSpentTime } from "utils";

const iconStyles = (hoverColor: string): SxProps<Theme> => ({
    "&:hover": {
        cursor: "pointer",
        fill: hoverColor,
    },
});

interface IActionButtonsProps {
    record: IssueSpentTimeRecordT;
    isOwner: boolean;
    onEdit: (comment: IssueSpentTimeRecordT) => void;
    onDelete: (comment: IssueSpentTimeRecordT) => void;
}

const ActionButtons: FC<IActionButtonsProps> = ({
    record,
    isOwner,
    onEdit,
    onDelete,
}) => {
    return (
        <Box
            className="actions"
            sx={{
                display: "none",
                alignItems: "center",
                gap: 1,
            }}
        >
            {isOwner && (
                <>
                    <EditIcon
                        sx={(theme) => ({
                            ...iconStyles(theme.palette.primary.main),
                        })}
                        onClick={() => onEdit(record)}
                        fontSize="small"
                    />

                    <DeleteIcon
                        sx={(theme) => ({
                            ...iconStyles(theme.palette.error.main),
                        })}
                        onClick={() => onDelete(record)}
                        fontSize="small"
                    />
                </>
            )}
        </Box>
    );
};

interface ISpentTimeCardProps {
    record: IssueSpentTimeRecordT;
    onEdit: (record: IssueSpentTimeRecordT) => void;
    onDelete: (record: IssueSpentTimeRecordT) => void;
}

const SpentTimeCard: FC<ISpentTimeCardProps> = ({
    record,
    onEdit,
    onDelete,
}) => {
    const user = useAppSelector((state) => state.profile.user);

    const isOwner = user?.id === record.user.id;

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                px: 1,
                py: 0.5,
                borderRadius: 0.5,
                "&:hover": {
                    backgroundColor: "action.hover",
                    "& .actions": {
                        display: "flex",
                    },
                },
            }}
        >
            <UserAvatar src={record.user.avatar} size={32} />

            <Box width="100%" fontSize={14}>
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography fontSize="inherit">
                            {record.user.name}
                        </Typography>

                        <Tooltip
                            title={dayjs
                                .utc(record.created_at)
                                .local()
                                .format("DD MMM YYYY HH:mm")}
                            placement="top"
                        >
                            <Typography
                                fontSize="inherit"
                                color="text.secondary"
                            >
                                {t("issues.spentTime.updated")}{" "}
                                {dayjs.utc(record.created_at).local().fromNow()}
                            </Typography>
                        </Tooltip>
                    </Box>

                    <ActionButtons
                        record={record}
                        isOwner={isOwner}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </Box>

                <Typography fontSize="inherit" mt={0.5}>
                    {t("issues.spentTime")}:{" "}
                    <Typography
                        component="span"
                        fontSize="inherit"
                        fontWeight="bold"
                    >
                        {formatSpentTime(record.spent_time)}
                    </Typography>
                </Typography>
            </Box>
        </Box>
    );
};

export { SpentTimeCard };
