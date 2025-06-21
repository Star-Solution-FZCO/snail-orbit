import type { ReactNode } from "react";

export type HeaderProps = {
    label: ReactNode;
    isClosed?: boolean;
    onClosedChange?: (value: boolean) => void;
    issueCount?: number;
};
