import CloseIcon from "@mui/icons-material/Close";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    TextField,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import type { FC } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { APITokenT } from "shared/model/types";
import { userApi } from "shared/model";
import { Clipboard } from "shared/ui";
import { toastApiError, useListQueryParams } from "shared/utils";

dayjs.extend(relativeTime);
dayjs.extend(utc);

interface IAddAPITokenDialogProps {
    open: boolean;
    onClose: () => void;
    onCreated: (token: string) => void;
}

const AddAPITokenDialog: FC<IAddAPITokenDialogProps> = ({
    open,
    onClose,
    onCreated,
}) => {
    const { t } = useTranslation();

    const [createToken, { isLoading }] = userApi.useCreateAPITokenMutation();

    const [name, setName] = useState("");
    const [expiresAt, setExpiresAt] = useState<Dayjs | null>(null);

    const handleClose = () => {
        setName("");
        setExpiresAt(null);
        onClose();
    };

    const handleClickCreate = () => {
        if (!name) return;

        createToken({
            name,
            expires_at: expiresAt ? expiresAt.toISOString() : null,
        })
            .unwrap()
            .then((response) => {
                onCreated(response.payload.token);
                handleClose();
            })
            .catch(toastApiError);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                {t("apiTokens.new.title")}

                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Stack gap={1} mt={2}>
                    <TextField
                        label={t("apiTokens.fields.name")}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        size="small"
                    />

                    <LocalizationProvider
                        dateAdapter={AdapterDayjs}
                        adapterLocale="en-gb"
                    >
                        <DatePicker
                            value={expiresAt ? dayjs(expiresAt) : null}
                            label={t("apiTokens.fields.expires")}
                            onChange={(date) => setExpiresAt(date)}
                            format="DD-MM-YYYY"
                            slotProps={{
                                textField: {
                                    size: "small",
                                },
                                actionBar: {
                                    actions: ["clear"],
                                },
                            }}
                        />
                    </LocalizationProvider>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    color="error"
                    disabled={isLoading}
                >
                    {t("cancel")}
                </Button>

                <Button
                    onClick={handleClickCreate}
                    variant="outlined"
                    disabled={!name}
                    loading={isLoading}
                >
                    {t("create")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export const APITokenList = () => {
    const { t } = useTranslation();

    const [listQueryParams, updateListQueryParams] = useListQueryParams();
    const { data, isLoading, isFetching } = userApi.useListAPITokenQuery();

    const [addTokenDialogOpen, setAddTokenDialogOpen] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    const columns: GridColDef<APITokenT>[] = useMemo(
        () => [
            {
                field: "name",
                headerName: t("apiTokens.fields.name"),
                flex: 1,
            },
            {
                field: "last_digits",
                headerName: t("apiTokens.fields.lastDigits"),
                flex: 1,
                renderCell: ({ row }) => `...${row.last_digits}`,
            },
            {
                field: "is_active",
                headerName: t("apiTokens.fields.active"),
                type: "boolean",
                flex: 1,
            },
            {
                field: "created_at",
                headerName: t("apiTokens.fields.created"),
                flex: 1,
                renderCell: ({ row }) =>
                    dayjs.utc(row.created_at).local().format("DD MMM YYYY"),
            },
            {
                field: "expires_at",
                headerName: t("apiTokens.fields.expires"),
                type: "boolean",
                flex: 1,
                renderCell: ({ row }) =>
                    row.expires_at
                        ? dayjs
                              .utc(row.expires_at)
                              .local()
                              .format("DD MMM YYYY")
                        : t("apiTokens.expires.never"),
            },
        ],
        [t],
    );

    const paginationModel = {
        page: listQueryParams.offset / listQueryParams.limit,
        pageSize: listQueryParams.limit,
    };

    const handlePaginationModelChange = (model: {
        page: number;
        pageSize: number;
    }) => {
        updateListQueryParams({
            limit: model.pageSize,
            offset: model.page * model.pageSize,
        });
    };

    const rows = data?.payload.items || [];
    const rowCount = data?.payload.count || 0;

    return (
        <Stack spacing={2} height={1}>
            <Box>
                <Button
                    onClick={() => setAddTokenDialogOpen(true)}
                    variant="outlined"
                    size="small"
                >
                    {t("profile.apiTokens.new")}
                </Button>
            </Box>

            <AddAPITokenDialog
                open={addTokenDialogOpen}
                onClose={() => {
                    setAddTokenDialogOpen(false);
                }}
                onCreated={setToken}
            />

            <Clipboard
                open={!!token}
                value={token || ""}
                onClose={() => setToken(null)}
            />

            <Box flex={1} position="relative">
                <Box sx={{ position: "absolute", inset: 0 }}>
                    <DataGrid
                        columns={columns}
                        rows={rows}
                        rowCount={rowCount}
                        paginationModel={paginationModel}
                        onPaginationModelChange={handlePaginationModelChange}
                        getRowId={(row) => row.created_at}
                        loading={isLoading || isFetching}
                        paginationMode="server"
                        density="compact"
                    />
                </Box>
            </Box>
        </Stack>
    );
};
