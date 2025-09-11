import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Collapse, IconButton, Stack, Typography } from "@mui/material";
import type { FC } from "react";
import { useState } from "react";
import { useAppSelector } from "shared/model";
import { CustomFieldT } from "shared/model/types";
import { Link } from "shared/ui";

export const Bundle: FC<{
    bundle: { gid: string; name: string; type: string; fields: CustomFieldT[] };
    onCustomFieldClick: (field: CustomFieldT) => void;
    selectedFieldId?: string;
}> = ({ bundle, onCustomFieldClick, selectedFieldId }) => {
    const isAdmin = useAppSelector(
        (state) => state.profile.user?.is_admin || false,
    );

    const [expanded, setExpanded] = useState(false);

    return (
        <Stack>
            <Stack
                direction="row"
                alignItems="center"
                gap={1}
                pb={0.5}
                mb={0.5}
                position="sticky"
                zIndex={1}
                borderBottom={1}
                borderColor="divider"
                top={0}
            >
                <IconButton
                    onClick={() => setExpanded((prev) => !prev)}
                    size="small"
                >
                    <ExpandMoreIcon
                        sx={{
                            transform: expanded
                                ? "rotate(180deg)"
                                : "rotate(0)",
                            transition: "transform 0.2s",
                        }}
                        fontSize="small"
                    />
                </IconButton>

                {isAdmin ? (
                    <Link
                        to="/custom-fields/$customFieldGroupId"
                        params={{
                            customFieldGroupId: bundle.gid,
                        }}
                        fontWeight="bold"
                    >
                        {bundle.name}
                    </Link>
                ) : (
                    <Typography fontWeight="bold">{bundle.name}</Typography>
                )}

                <Box flex={1} />

                <Typography color="text.secondary">{bundle.type}</Typography>
            </Stack>

            <Collapse in={expanded}>
                <Stack pl={0.5} pt={0.5}>
                    {bundle.fields.map((field) => {
                        const isSelected = selectedFieldId === field.id;
                        return (
                            <Stack
                                key={field.id}
                                sx={{
                                    "&:hover": {
                                        backgroundColor: "action.hover",
                                    },
                                    cursor: "pointer",
                                    borderRadius: 1,
                                    backgroundColor: isSelected
                                        ? "action.selected"
                                        : "transparent",
                                }}
                                px={1}
                                py={0.5}
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                gap={1}
                                onClick={() => onCustomFieldClick(field)}
                            >
                                <Typography
                                    fontWeight={isSelected ? "bold" : "normal"}
                                >
                                    {field.label}
                                </Typography>
                            </Stack>
                        );
                    })}
                </Stack>
            </Collapse>
        </Stack>
    );
};
