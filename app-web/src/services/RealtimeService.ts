import { store } from "../models/store";
import { api } from "./api"; // Assuming api has auth token access, or we get from localStorage

export class RealtimeService {
    private eventSource: EventSource | null = null;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private retryCount = 0;
    private readonly MAX_RETRIES = 5;
    private readonly BASE_DELAY = 1000;

    constructor() { }

    public connect() {
        if (this.eventSource?.readyState === EventSource.OPEN) {
            console.log("[Realtime] Already connected");
            return;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.warn("[Realtime] No accessToken found, skipping connection");
            return;
        }

        const apiUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000';
        const url = `${apiUrl}/stream?token=${token}`;

        console.log(`[Realtime] Connecting to SSE: ${apiUrl}/api/stream... (Token length: ${token.length})`);

        this.eventSource = new EventSource(url);

        this.eventSource.onopen = () => {
            console.log("[Realtime] Connected successfully");
            this.retryCount = 0;
        };

        this.eventSource.onerror = (err) => {
            console.warn("[Realtime] Connection error, reconnecting...", err);
            this.eventSource?.close();
            this.scheduleReconnect();
        };

        this.eventSource.addEventListener('message', (e) => {
            // Heartbeat or generic
        });

        // Register handlers for specific events
        const eventTypes = [
            'task.created', 'task.updated', 'task.deleted',
            'group.created', 'group.updated', 'group.deleted',
            'workspace.created', 'workspace.updated', 'workspace.deleted',
            'workspace.member_added', 'workspace.member_removed',
            'label.created', 'label.updated', 'label.deleted',
            'notification.created', 'notification.updated',
            'settings.updated'
        ];

        eventTypes.forEach(type => {
            this.eventSource?.addEventListener(type, (e: MessageEvent) => {
                try {
                    const data = JSON.parse(e.data);
                    store.realtimeHandler.handleEvent(type, data);
                } catch (err) {
                    console.error("[Realtime] Failed to parse event data", err);
                }
            });
        });
    }

    public disconnect() {
        this.eventSource?.close();
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    }

    private scheduleReconnect() {
        if (this.retryCount >= this.MAX_RETRIES) {
            console.error("[Realtime] Max retries reached. Giving up.");
            return;
        }

        const delay = Math.min(this.BASE_DELAY * Math.pow(2, this.retryCount), 30000);
        this.reconnectTimeout = setTimeout(() => {
            this.retryCount++;
            this.connect();
        }, delay);
    }
}

export const realtimeService = new RealtimeService();
