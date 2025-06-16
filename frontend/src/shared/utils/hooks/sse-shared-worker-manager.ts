import { EVENTS_URL } from "app/config";

export type WorkerEvent = {
    type: "open" | "message" | "error";
    data?: any;
    path?: string;
};

type WorkerMessage = {
    baseUrl: string;
    path: string;
    type: "subscribe" | "unsubscribe";
    id: string;
};

export class SSESharedWorkerManager {
    private static instance: SSESharedWorkerManager;
    private worker: SharedWorker;
    private port: MessagePort;
    private subscribers = new Map<string, Set<(data: WorkerEvent) => void>>();
    private isConnected = false;

    private constructor() {
        this.worker = new SharedWorker(
            new URL("./sse-worker-script.ts", import.meta.url),
            {
                name: "Server Sent Events Shared Worker",
            },
        );
        this.port = this.worker.port;

        this.port.start();

        this.port.onmessage = (event: MessageEvent<WorkerEvent>) => {
            const { type, path, data } = event.data;

            if (type === "open" && !this.isConnected) {
                this.isConnected = true;
            }

            const urlSubscribers = this.subscribers.get(path || "");

            if (!urlSubscribers) {
                return;
            }

            urlSubscribers.forEach((callback) => {
                try {
                    callback({ type, data });
                } catch (error) {}
            });
        };
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new SSESharedWorkerManager();
        }
        return this.instance;
    }

    subscribe(
        path: string,
        callback: (event: WorkerEvent) => void,
    ): () => void {
        const subscriberId = Math.random().toString(36).substring(2, 15);

        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }

        this.subscribers.get(path)!.add(callback);

        const message: WorkerMessage = {
            baseUrl: EVENTS_URL,
            path,
            type: "subscribe",
            id: subscriberId,
        };

        this.port.postMessage(message);

        return () => {
            const urlSubscribers = this.subscribers.get(path);
            if (urlSubscribers) {
                urlSubscribers.delete(callback);

                if (urlSubscribers.size === 0) {
                    this.subscribers.delete(path);

                    const unsubMessage: WorkerMessage = {
                        baseUrl: EVENTS_URL,
                        path,
                        type: "unsubscribe",
                        id: subscriberId,
                    };

                    this.port.postMessage(unsubMessage);
                }
            }
        };
    }
}
