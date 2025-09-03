import { Stack, styled } from "@mui/material";
import type { FC } from "react";
import { DashboardTileT } from "shared/model/types";
import { WidgetHeading } from "./heading";

export const WidgetContainer = styled(Stack)(({ theme }) => ({
    width: "calc(50% - 8px)",
    minHeight: 160,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.palette.divider,
    borderRadius: theme.spacing(2),
    gap: theme.spacing(1),
}));

interface WidgetBaseProps extends React.PropsWithChildren {
    widget: DashboardTileT;
    onEdit: (widget: DashboardTileT) => void;
    onDelete: (widget: DashboardTileT) => void;
    canManage?: boolean;
}

export const WidgetBase: FC<WidgetBaseProps> = ({ children, ...props }) => {
    return (
        <WidgetContainer
            height={props.widget.ui_settings?.height as number | undefined}
        >
            <WidgetHeading {...props} />

            {children}
        </WidgetContainer>
    );
};
