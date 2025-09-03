import AddIcon from "@mui/icons-material/Add";
import { Button, Container, Stack, TextField } from "@mui/material";
import { useCreateIssueNavbarSettings } from "modules/issues/hooks/use-create-issue-navbar-settings";
import { useTranslation } from "react-i18next";
import { reportApi } from "shared/model/api/report.api";
import { useListQueryParams } from "shared/utils";
import { Link } from "../../shared/ui";

const perPageOptions = [10, 25, 50, 100, 500, 1000];

export const ReportsList = () => {
    const { t } = useTranslation();

    useCreateIssueNavbarSettings();

    const [listQueryParams, updateListQueryParams] = useListQueryParams();

    const {} = reportApi.useListReportsQuery(listQueryParams);

    return (
        <Container
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%",
                px: 4,
                pb: 4,
            }}
            disableGutters
        >
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <TextField
                    fullWidth
                    size="small"
                    placeholder={t("reports.list.search.placeholder")}
                />

                <Link to="/reports/create">
                    <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        sx={{ textWrap: "nowrap", height: "40px" }}
                    >
                        {t("reports.create.title")}
                    </Button>
                </Link>
            </Stack>
        </Container>
    );
};
