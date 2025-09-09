import { ExpandMore } from "@mui/icons-material";
import { Button, Typography } from "@mui/material";
import type { FC, MouseEventHandler } from "react";
import { useState } from "react";
import type { DashboardT } from "shared/model/types";
import { DashboardListPopover } from "./dashboard_list_popover";

type DashboardSelectProps = {
    value: DashboardT;
    onChange: (value: DashboardT) => void;
    onCreate: () => void;
};

export const DashboardSelect: FC<DashboardSelectProps> = (props) => {
    const { value, onChange, onCreate } = props;

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

            <DashboardListPopover
                open={!!buttonRef}
                anchorEl={buttonRef}
                onClose={() => setButtonRef(null)}
                onSelect={onChange}
                onCreate={onCreate}
            />
        </>
    );
};
