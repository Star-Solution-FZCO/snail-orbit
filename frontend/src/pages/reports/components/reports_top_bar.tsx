import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import { Button, IconButton, Stack } from "@mui/material";
import { ReportSelect } from "modules/reports/components/report_select";
import { useTranslation } from "react-i18next";
import type { ReportT } from "shared/model/types/report";
import { Link } from "shared/ui";
import { canEdit, isAdmin } from "shared/utils/permissions/checks";

type ReportsTopBarProps = {
    report?: ReportT;
    onEditClick?: () => unknown;
    onDeleteClick?: () => unknown;
    showDeleteButton?: boolean;
};

export const ReportTopBar = (props: ReportsTopBarProps) => {
    const { t } = useTranslation();
    const {
        report,
        onEditClick,
        onDeleteClick,
        showDeleteButton = false,
    } = props;

    const isCanEdit = canEdit(report?.current_permission);
    const isCanDelete = isAdmin(report?.current_permission);

    return (
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
        >
            <Stack direction="row" alignItems="center" gap={1}>
                <ReportSelect value={report} />

                {isCanEdit && (
                    <IconButton onClick={() => onEditClick?.()} color="primary">
                        <SettingsIcon />
                    </IconButton>
                )}

                {isCanDelete && showDeleteButton && (
                    <IconButton onClick={() => onDeleteClick?.()} color="error">
                        <DeleteIcon />
                    </IconButton>
                )}
            </Stack>

            <Stack direction="row" alignItems="center" gap={1}>
                <Link to="/reports/create">
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                    >
                        {t("reports.new")}
                    </Button>
                </Link>
            </Stack>
        </Stack>
    );
};
