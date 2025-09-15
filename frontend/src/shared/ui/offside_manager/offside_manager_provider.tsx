import { Box, Divider } from "@mui/material";
import type { PropsWithChildren, RefObject } from "react";
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface OffsideManagerContextType {
    setRightPanelId: (id: string) => void;
    rightPanelId: string;
    dropRightPanelById: (id: string) => void;
    rightPanelRef: RefObject<HTMLDivElement | null>;
}

const OffsideManagerContext = createContext<
    OffsideManagerContextType | undefined
>(undefined);

export const OffsideManagerProvider = (props: PropsWithChildren) => {
    const { children } = props;
    const [rightPanelId, setRightPanelId] = useState<string>("");
    const rightPanelRef = useRef<HTMLDivElement>(null);

    const dropRightPanelById = useCallback((id: string) => {
        setRightPanelId((prev) => {
            if (prev === id) return "";
            return prev;
        });
    }, []);

    const contextValues = useMemo(
        () => ({
            rightPanelId,
            setRightPanelId,
            rightPanelRef,
            dropRightPanelById,
        }),
        [dropRightPanelById, rightPanelId],
    );

    return (
        <OffsideManagerContext.Provider value={contextValues}>
            <Box
                id="offsideManagerRoot"
                autoSaveId="offsideManagerRoot"
                component={PanelGroup}
                direction="horizontal"
                maxWidth="100vw"
            >
                <Box
                    component={Panel}
                    defaultSize={85}
                    maxSize={100}
                    minSize={20}
                >
                    {children}
                </Box>
                <Box
                    id="queryBuilderResizer"
                    component={PanelResizeHandle}
                    order={9}
                    sx={{ display: rightPanelId ? "block" : "none" }}
                >
                    <Divider orientation="vertical" />
                </Box>
                <Box
                    id="queryBuilder"
                    order={10}
                    sx={{ display: rightPanelId ? "block" : "none" }}
                    component={Panel}
                    maxSize={20}
                    defaultSize={15}
                    pr={4}
                    minSize={15}
                >
                    <div ref={rightPanelRef} />
                </Box>
            </Box>
        </OffsideManagerContext.Provider>
    );
};

export const useOffsideManager = () => {
    const context = useContext(OffsideManagerContext);
    if (!context) {
        throw new Error(
            "useOffsideManager must be used within an OffsideManagerProvider",
        );
    }
    return context;
};
