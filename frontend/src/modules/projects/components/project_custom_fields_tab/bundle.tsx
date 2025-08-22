import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Collapse, IconButton, Stack, Typography } from "@mui/material";
import type { FC } from "react";
import { useState } from "react";
import { useAppSelector } from "shared/model";
import { CustomFieldT } from "shared/model/types";
import { Link } from "shared/ui";

export const Bundle: FC<{
    bundle: { gid: string; name: string; fields: CustomFieldT[] };
    onAddCustomFieldClick: (id: string) => void;
}> = ({ bundle, onAddCustomFieldClick }) => {
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
            </Stack>

            <Collapse in={expanded}>
                <Stack pl={0.5} pt={0.5}>
                    {bundle.fields.map((field) => (
                        <Box
                            key={field.id}
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            gap={1}
                        >
                            <Box display="flex" alignItems="center" gap={1}>
                                <IconButton
                                    onClick={() =>
                                        onAddCustomFieldClick(field.id)
                                    }
                                    size="small"
                                >
                                    <AddIcon fontSize="small" />
                                </IconButton>

                                <Typography flex={1} fontWeight="bold">
                                    {field.label}
                                </Typography>
                            </Box>

                            <Typography>{field.type}</Typography>
                        </Box>
                    ))}
                </Stack>
            </Collapse>
        </Stack>
    );
};
