import { ExpandMore } from "@mui/icons-material";
import { Button, Typography } from "@mui/material";
import { type MouseEventHandler, useState } from "react";
import type { ReportT } from "shared/model/types/report";
import { ReportListPopover } from "./report_list_popover";

type ReportSelectProps = {
    value?: ReportT;
    onChange?: (value: ReportT) => void;
};

export const ReportSelect = (props: ReportSelectProps) => {
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
                    {value?.name}
                </Typography>
            </Button>

            <ReportListPopover
                open={!!buttonRef}
                anchorEl={buttonRef}
                onClose={() => setButtonRef(null)}
                onSelect={onChange}
            />
        </>
    );
};
