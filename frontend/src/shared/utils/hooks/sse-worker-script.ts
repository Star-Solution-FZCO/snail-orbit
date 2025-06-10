interface ConnectionData {
    eventSource: EventSource;
    subscribers: Set<string>;
    lastActivity: number;
}

interface WorkerMessage {
    type: "subscribe" | "unsubscribe";
    path: string;
    id: string;
    baseUrl?: string;
}

interface BroadcastMessage {
    type: "open" | "message" | "error";
    data?: any;
    path?: string;
}

const connections = new Map<string, ConnectionData>();
const ports = new Set<MessagePort>();

self.addEventListener("connect", (event: Event) => {
    const port = (event as MessageEvent).ports[0];
    ports.add(port);

    port.onmessage = (e: MessageEvent<WorkerMessage>) => {
        const { type, path, id, baseUrl } = e.data;

        switch (type) {
            case "subscribe":
                if (baseUrl) {
                    handleSubscribe(path, id, port, baseUrl);
                }
                break;
            case "unsubscribe":
                handleUnsubscribe(path, id);
                break;
        }
    };

    port.onmessageerror = () => {
        ports.delete(port);
    };

    port.start();
});

function handleSubscribe(
    path: string,
    subscriberId: string,
    port: MessagePort,
    baseUrl: string,
): void {
    const url = baseUrl + path;

    if (!connections.has(path)) {
        const eventSource = new EventSource(url);

        const connectionData: ConnectionData = {
            eventSource,
            subscribers: new Set([subscriberId]),
            lastActivity: Date.now(),
        };

        eventSource.onopen = () => {
            broadcastToSubscribers(path, { type: "open" });
        };

        eventSource.onmessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                broadcastToSubscribers(path, { type: "message", data });
                connectionData.lastActivity = Date.now();
            } catch (error) {
                broadcastToSubscribers(path, {
                    type: "message",
                    data: event.data,
                });
            }
        };

        eventSource.onerror = () => {
            broadcastToSubscribers(path, { type: "error" });
        };

        connections.set(path, connectionData);
    } else {
        const connection = connections.get(path)!;
        connection.subscribers.add(subscriberId);

        const readyState = connection.eventSource.readyState;
        if (readyState === EventSource.OPEN) {
            port.postMessage({ type: "open", path });
        } else if (readyState === EventSource.CLOSED) {
            port.postMessage({ type: "error", path });
        }
    }
}

function handleUnsubscribe(path: string, subscriberId: string): void {
    const connection = connections.get(path);
    if (!connection) return;

    connection.subscribers.delete(subscriberId);

    if (connection.subscribers.size === 0) {
        connection.eventSource.close();
        connections.delete(path);
    }
}

function broadcastToSubscribers(path: string, message: BroadcastMessage): void {
    const connection = connections.get(path);
    if (!connection) return;

    ports.forEach((port) => {
        try {
            port.postMessage({ ...message, path });
        } catch (error) {
            ports.delete(port);
        }
    });
}

setInterval(() => {
    const now = Date.now();
    const TIMEOUT = 60000;

    for (const [path, connection] of connections.entries()) {
        if (
            now - connection.lastActivity > TIMEOUT &&
            connection.subscribers.size === 0
        ) {
            connection.eventSource.close();
            connections.delete(path);
        }
    }
}, 30000);
