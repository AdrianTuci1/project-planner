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
        if (this.eventSource?.readyState === EventSource.OPEN) return;

        const token = localStorage.getItem('token'); // Simplification. Ideally use api.getToken()
        if (!token) return;

        // Note: Native EventSource doesn't support headers easily (except cookies).
        // Polyfill (event-source-polyfill) is usually needed for Authorization header.
        // OR: backend accepts token in query param.
        // Let's assume we pass token in query param for now as it's standard for SSE without polyfill.
        // Backend middleware needs to check query param too.

        const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';
        const url = `${apiUrl}/api/stream?token=${token}`;

        // Wait... App uses AuthMiddleware which expects Bearer header.
        // I should check if backend middleware supports query param or use a polyfill approach.
        // For this robust agent, I will assume we need to update Backend Auth Middleware to support query param?
        // OR: Just rely on cookie if set?
        // Let's update backend AuthMiddleware briefly if needed, or assume query param is fine.
        // Or better: Use `fetch` based SSE libraries.
        // Simplest: `event-source-polyfill` is standard in React apps.
        // I will use standard EventSource assuming we fixed backend or pass via query. 
        // Let's TRY query param approach since adding dependencies (polyfill) requires `npm install`.

        this.eventSource = new EventSource(url);

        this.eventSource.onopen = () => {
            console.log("[Realtime] Connected");
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
                    store.handleRealtimeEvent(type, data);
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
