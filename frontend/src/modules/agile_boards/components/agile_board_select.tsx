import { ExpandMore } from "@mui/icons-material";
import { Button, Typography } from "@mui/material";
import type { FC, MouseEventHandler } from "react";
import { useState } from "react";
import type { AgileBoardT } from "types";
import { AgileBoardListPopover } from "./agile_board_list_popover";

type AgileBoardSelectProps = {
    value: AgileBoardT;
    onChange: (value: AgileBoardT) => void;
};

export const AgileBoardSelect: FC<AgileBoardSelectProps> = (props) => {
    const { value, onChange } = props;

    const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);

    const handleButtonClick: MouseEventHandler<HTMLButtonElement> = (e) => {
        setButtonRef((prev) => (prev ? null : e.currentTarget));
    };

    return (
        <>
            <Button
                variant="contained"
                size="small"
                endIcon={<ExpandMore />}
                onClick={handleButtonClick}
                sx={{ flexShrink: 0, flexGrow: 1 }}
            >
                <Typography
                    fontSize="medium"
                    fontWeight="bold"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                    textTransform="none"
                    width="100%"
                >
                    {value.name}
                </Typography>
            </Button>
            <AgileBoardListPopover
                open={!!buttonRef}
                anchorEl={buttonRef}
                onClose={() => setButtonRef(null)}
                onSelect={onChange}
            />
        </>
    );
};
