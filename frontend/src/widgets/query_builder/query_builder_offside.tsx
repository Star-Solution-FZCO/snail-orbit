import { Portal } from "@mui/material";
import type { ComponentProps } from "react";
import { useEffect } from "react";
import { useOffsideManager } from "shared/ui/offside_manager/offside_manager_provider";
import QueryBuilder from "./query_builder";

type QueryBuilderOffsideProps = ComponentProps<typeof QueryBuilder> & {
    id: string;
    isOpen?: boolean;
};

export const QueryBuilderOffside = (props: QueryBuilderOffsideProps) => {
    const { id, isOpen, ...restProps } = props;
    const { setRightPanelId, rightPanelRef, rightPanelId, dropRightPanelById } =
        useOffsideManager();

    useEffect(() => {
        if (isOpen && id) setRightPanelId(id);
        if (!isOpen) dropRightPanelById(id);
    }, [isOpen, id, setRightPanelId, dropRightPanelById]);

    useEffect(() => {
        return () => {
            dropRightPanelById(id);
        };
        // On unmount handler
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (rightPanelId !== id) return null;

    return (
        <Portal container={rightPanelRef.current || null}>
            <QueryBuilder {...restProps} />
        </Portal>
    );
};
