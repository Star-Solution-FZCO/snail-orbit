import DeleteIcon from "@mui/icons-material/Delete";
import { Button, Checkbox, Menu, MenuItem, Stack } from "@mui/material";
import {
    DataGrid,
    GridActionsCellItem,
    type GridColDef,
} from "@mui/x-data-grid";
import { bindMenu, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";
import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { encryptionKeysApi } from "shared/model";
import type {
    EncryptionKeyAlgorithmT,
    EncryptionKeyT,
} from "shared/model/types";
import { toastApiError, useListQueryParams } from "shared/utils";
import {
    exportPublicKey,
    generateKeyPair,
    getFingerprint,
    writeKeyPairToDB,
} from "shared/utils/crypto/crypto";
import { getAllKeys } from "shared/utils/crypto/crypto_keys";

const emptyArr = [] as EncryptionKeyT[];

export const Keys = memo(() => {
    const { t } = useTranslation();
    const popupState = usePopupState({
        popupId: "keys-create-new-menu",
        variant: "popover",
    });

    const [isKeyCreating, setIsKeyCreating] = useState(false);
    const [localKeyFingerprints, setLocalKeyFingerprints] = useState<
        Set<string>
    >(new Set());

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        limit: 50,
    });

    const {
        data,
        isLoading: isKeysLoading,
        isFetching: isKeysFetching,
    } = encryptionKeysApi.useListEncryptionKeysQuery(listQueryParams);

    const [addKey, { isLoading: isAddKeyLoading }] =
        encryptionKeysApi.useAddEncryptionKeyMutation();
    const [deleteKey, { isLoading: isDeleteKeyLoading }] =
        encryptionKeysApi.useDeleteEncryptionKeyMutation();
    const [updateKey, { isLoading: isUpdateKeyLoading }] =
        encryptionKeysApi.useUpdateEncryptionKeyMutation();

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

    const handleCreateNew = async (variant: EncryptionKeyAlgorithmT) => {
        setIsKeyCreating(true);
        try {
            popupState.close();
            const keyPair = await generateKeyPair(variant);
            const fingerprint = await getFingerprint(keyPair.publicKey);
            const publicKey = await exportPublicKey(keyPair.publicKey);
            const name = `${variant}-${fingerprint}`;
            await addKey({
                name,
                fingerprint,
                public_key: publicKey,
                algorithm: variant,
                is_active: true,
            })
                .unwrap()
                .then(() => {
                    writeKeyPairToDB(keyPair);
                    setLocalKeyFingerprints((prev) =>
                        new Set(prev).add(fingerprint),
                    );
                })
                .catch(toastApiError);
        } finally {
            setIsKeyCreating(false);
        }
    };

    const handleRowUpdate = async (newRow: EncryptionKeyT) => {
        return updateKey({
            fingerprint: newRow.fingerprint,
            name: newRow.name,
        })
            .unwrap()
            .then((el) => el.payload);
    };

    const columns: GridColDef<EncryptionKeyT>[] = useMemo(
        () => [
            {
                field: "name",
                headerName: t("profile.keys.name"),
                flex: 1,
                editable: true,
            },
            {
                field: "fingerprint",
                headerName: t("profile.keys.fingerprint"),
                flex: 1,
            },
            {
                field: "algorithm",
                headerName: t("profile.keys.algorithm"),
                flex: 1,
            },
            {
                field: "is_active",
                headerName: t("profile.keys.isActive"),
                flex: 0,
                width: 120,
                renderCell: ({ value, row }) => (
                    <Checkbox
                        sx={{ p: 1 }}
                        size="small"
                        checked={value}
                        onChange={(_, newValue) =>
                            updateKey({
                                fingerprint: row.fingerprint,
                                is_active: newValue,
                            })
                        }
                    />
                ),
            },
            {
                field: "is_local",
                headerName: t("profile.keys.local"),
                type: "boolean",
                valueGetter: (_, row) =>
                    localKeyFingerprints.has(row.fingerprint),
            },
            {
                field: "actions",
                headerName: t("actions"),
                type: "actions",
                getActions: ({ row }) => {
                    return [
                        <GridActionsCellItem
                            icon={<DeleteIcon />}
                            label={t("delete")}
                            color="error"
                            onClick={() =>
                                deleteKey({ fingerprint: row.fingerprint })
                            }
                        />,
                    ];
                },
                flex: 0,
            },
        ],
        [t, localKeyFingerprints, deleteKey, updateKey],
    );

    useEffect(() => {
        const loadLocalKeys = async () => {
            try {
                const keys = await getAllKeys();
                const fingerprints = new Set(
                    keys.map((key) => key.fingerprint),
                );

                setLocalKeyFingerprints(fingerprints);
            } catch (error) {
                console.error("Failed to load local keys:", error);
            }
        };
        loadLocalKeys();
    }, []);

    const rows = data?.payload.items || emptyArr;
    const rowCount = data?.payload.count || 0;
    const isLoading =
        isKeysLoading ||
        isKeyCreating ||
        isKeysFetching ||
        isDeleteKeyLoading ||
        isAddKeyLoading ||
        isUpdateKeyLoading;

    return (
        <Stack spacing={2} height={1}>
            <Stack direction="row">
                <Button
                    size="small"
                    variant="outlined"
                    {...bindTrigger(popupState)}
                >
                    {t("profile.keys.new")}
                </Button>
                <Menu {...bindMenu(popupState)}>
                    <MenuItem
                        onClick={() => handleCreateNew("X25519")}
                        disabled={isLoading}
                    >
                        {t("keys.x25519")} ({t("recommended")})
                    </MenuItem>
                    <MenuItem
                        onClick={() => handleCreateNew("RSA")}
                        disabled={isLoading}
                    >
                        {t("keys.rsa")}
                    </MenuItem>
                </Menu>
            </Stack>

            <DataGrid
                sx={{
                    "& .MuiDataGrid-row": {
                        cursor: "pointer",
                    },
                }}
                columns={columns}
                rows={rows}
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={handlePaginationModelChange}
                loading={isLoading}
                paginationMode="server"
                density="compact"
                getRowId={(key) => key.fingerprint}
                processRowUpdate={handleRowUpdate}
            />
        </Stack>
    );
});

Keys.displayName = "Keys";
