import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import { Button, IconButton, Stack } from "@mui/material";
import { ReportSelect } from "modules/reports/components/report_select";
import { useTranslation } from "react-i18next";
import type { ReportT } from "shared/model/types/report";
import { Link } from "shared/ui";
import { canEdit } from "shared/utils/permissions/checks";

type ReportsTopBarProps = {
    report?: ReportT;
    onEditClick?: () => unknown;
};

export const ReportTopBar = (props: ReportsTopBarProps) => {
    const { t } = useTranslation();
    const { report, onEditClick } = props;

    const isCanEdit = canEdit(report?.current_permission);

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
