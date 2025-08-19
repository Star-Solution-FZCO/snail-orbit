import { Box, Divider } from "@mui/material";
import { useLocation } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import QueryBuilder from "./query_builder";

interface QueryBuilderContextType {
    showQueryBuilder: boolean;
    setShowQueryBuilder: (value: boolean) => unknown;
    query: string;
    setQuery: (value: string) => unknown;
}

const QueryBuilderContext = createContext<QueryBuilderContextType | null>(null);

export const QueryBuilderProvider = (props: PropsWithChildren) => {
    const { children } = props;
    const [showQueryBuilder, setShowQueryBuilder] = useState(false);
    const [innerQuery, setInnerQuery] = useState<string>("");
    const location = useLocation();

    useEffect(() => {
        setShowQueryBuilder(false);
    }, [location.pathname]);

    const contextValues = useMemo<QueryBuilderContextType>(
        () => ({
            query: innerQuery,
            setQuery: setInnerQuery,
            setShowQueryBuilder,
            showQueryBuilder,
        }),
        [innerQuery, showQueryBuilder],
    );

    return (
        <QueryBuilderContext.Provider value={contextValues}>
            <Box
                id="queryBuilderRoot"
                autoSaveId="queryBuilderRoot"
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

                {showQueryBuilder && (
                    <>
                        <Box
                            id="queryBuilderResizer"
                            component={PanelResizeHandle}
                            order={9}
                        >
                            <Divider orientation="vertical" />
                        </Box>

                        <Box
                            id="queryBuilder"
                            order={10}
                            component={Panel}
                            maxSize={20}
                            defaultSize={15}
                            pr={4}
                            minSize={15}
                        >
                            <QueryBuilder
                                onChangeQuery={setInnerQuery}
                                initialQuery={innerQuery}
                            />
                        </Box>
                    </>
                )}
            </Box>
        </QueryBuilderContext.Provider>
    );
};

export const useQueryBuilder = () => {
    const context = useContext(QueryBuilderContext);
    if (!context)
        throw new Error(
            "useQueryBuilder must be used within QueryBuilderProvider",
        );
    return context;
};
