import { useState } from "react";
import type { TagLinkT, TagT } from "shared/model/types";
import FieldCard from "shared/ui/fields/field_card/field_card";
import { TagManagerPopover } from "./tag_manager_popover";

type TagFieldProps = {
    value?: TagLinkT;
    label: string;
    variant?: "standard" | "error";
    onChange?: (value: TagT) => void;
};

export const TagField = (props: TagFieldProps) => {
    const { variant, onChange, value, label } = props;

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    return (
        <>
            <FieldCard
                label={label}
                value={value?.name || "?"}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                variant={variant}
                orientation="vertical"
            />

            <TagManagerPopover
                open={!!anchorEl}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                onSelect={onChange}
            />
        </>
    );
};
