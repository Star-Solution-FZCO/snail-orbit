import { alpha, Chip } from "@mui/material";
import type { ComponentProps } from "react";
import { memo } from "react";
import { getContrastText } from "../theme/contrast-text";

export type TagProps = {
    label: string;
    color: string;
} & Pick<ComponentProps<typeof Chip>, "onDelete">;

export const Tag = memo((props: TagProps) => {
    const { label, onDelete, color } = props;

    const contrastColor = getContrastText(color);

    return (
        <Chip
            label={label}
            onDelete={onDelete}
            size="small"
            sx={{
                boxShadow: 3,
                backgroundColor: color,
                color: contrastColor,
                ".MuiChip-deleteIcon": {
                    color: contrastColor,
                    ":hover": { color: alpha(contrastColor, 0.6) },
                },
            }}
        />
    );
});

Tag.displayName = "Tag";
