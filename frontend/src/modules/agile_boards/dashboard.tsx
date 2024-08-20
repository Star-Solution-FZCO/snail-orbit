import AddIcon from "@mui/icons-material/Add";
import {
    Autocomplete,
    Box,
    IconButton,
    TextField,
    Typography,
} from "@mui/material";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "store";

const mockColumns = [
    "Open",
    "Postponed",
    "Paused",
    "In Progress",
    "Feedback",
    "Closed",
];

const AgileBoardsDashboard = () => {
    const { t } = useTranslation();

    const { data: boards, isLoading } = agileBoardApi.useListAgileBoardQuery();

    return (
        <Box
            display="flex"
            flexDirection="column"
            px={4}
            pb={4}
            height="100%"
            gap={2}
        >
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography fontSize={24} fontWeight="bold">
                        {t("agileBoards.title")}
                    </Typography>

                    <Link to="/agiles/create">
                        <IconButton size="small">
                            <AddIcon />
                        </IconButton>
                    </Link>
                </Box>
            </Box>

            <Box display="flex" gap={1}>
                <Box minWidth="300px">
                    <Autocomplete
                        options={boards?.payload?.items || []}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={t("agileBoards.select.label")}
                            />
                        )}
                        getOptionLabel={(option) => option.name}
                        loading={isLoading}
                        size="small"
                    />
                </Box>

                <Box flex={1}>
                    <TextField
                        placeholder={t("agileBoards.search.placeholder")}
                        size="small"
                        fullWidth
                    />
                </Box>
            </Box>

            <Box display="flex" flex={1}>
                {mockColumns.map((column) => (
                    <Box
                        key={column}
                        display="flex"
                        flexDirection="column"
                        flex={1}
                        border={1}
                    >
                        <Box p={2} borderBottom={1}>
                            <Typography fontWeight="bold">{column}</Typography>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export { AgileBoardsDashboard };
