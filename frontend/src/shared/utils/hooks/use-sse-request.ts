import { useEffect, useRef, useState } from "react";
import {
    SSESharedWorkerManager,
    WorkerEvent,
} from "./sse-shared-worker-manager";

type UseSseRequestParams<T> = {
    url: string;
    onMessage?: (data: T) => void;
};

export const useSseRequest = <T>(params: UseSseRequestParams<T>) => {
    const { url, onMessage } = params;

    const [isLoading, setIsLoading] = useState<boolean>(!document.hidden);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const onMessageRef = useRef(onMessage);
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const isPageVisible = useRef(!document.hidden);

    const subscribe = () => {
        if (unsubscribeRef.current || !isPageVisible.current) {
            return;
        }

        setIsLoading(true);
        
        const manager = SSESharedWorkerManager.getInstance();

        const handleWorkerMessage = (event: WorkerEvent) => {
            switch (event.type) {
                case "open":
                    setIsLoading(false);
                    setIsOpen(true);
                    break;

                case "message":
                    if (onMessageRef.current && event.data) {
                        onMessageRef.current(event.data as T);
                    }
                    break;

                case "error":
                    setIsLoading(false);
                    setIsOpen(false);
                    break;
            }
        };

        unsubscribeRef.current = manager.subscribe(url, handleWorkerMessage);
    };

    const unsubscribe = () => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;

            setIsOpen(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            const isVisible = !document.hidden;
            isPageVisible.current = isVisible;

            if (isVisible) {
                subscribe();
            } else {
                unsubscribe();
            }
        };

        if (!document.hidden) {
            subscribe();
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
            unsubscribe();
        };
    }, [url]);

    return {
        isLoading,
        isOpen,
    };
};
