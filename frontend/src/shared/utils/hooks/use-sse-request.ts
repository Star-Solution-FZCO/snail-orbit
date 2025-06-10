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

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const onMessageRef = useRef(onMessage);

    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
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

        const unsubscribe = manager.subscribe(url, handleWorkerMessage);

        return unsubscribe;
    }, [url]);

    return { isLoading, isOpen };
};
