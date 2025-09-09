import { Stack, styled } from "@mui/material";
import type { FC } from "react";
import { WidgetHeading } from "./heading";
import { WidgetProps } from "./types";

export const WidgetContainer = styled(Stack)(({ theme }) => ({
    width: "100%",
    minHeight: 160,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.palette.divider,
    borderRadius: theme.spacing(2),
}));

interface WidgetBaseProps extends React.PropsWithChildren, WidgetProps {
    onRefresh: () => void;
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
