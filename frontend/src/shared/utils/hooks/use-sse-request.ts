import { EVENTS_URL } from "app/config";
import { useEffect, useState } from "react";

type UseSseRequestParams<T> = {
    url: string;
    onMessage?: (data: T) => void;
};

const baseUrl = EVENTS_URL;

export const useSseRequest = <T>(params: UseSseRequestParams<T>) => {
    const { url, onMessage } = params;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    useEffect(() => {
        setIsLoading(true);

        const eventSource = new EventSource(baseUrl + url);

        eventSource.onopen = () => {
            setIsLoading(false);
            setIsOpen(true);
        };

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data) as T;
            onMessage?.(data);
        };

        return () => {
            eventSource.close();
            setIsOpen(false);
        };
    }, [onMessage, url]);

    return { isLoading, isOpen };
};
