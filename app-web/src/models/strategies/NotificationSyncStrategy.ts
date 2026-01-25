import { action, makeAutoObservable, runInAction } from "mobx";
import { api } from "../../services/api";
import { NotificationStore, Notification } from "../stores/NotificationStore";

export class NotificationSyncStrategy {
    private store: NotificationStore | null = null;
    private pollingInterval: NodeJS.Timeout | null = null;
    private readonly POLL_MS = 30000; // 30 seconds

    constructor() {
        makeAutoObservable(this);
    }

    init(store: NotificationStore) {
        this.store = store;
        this.loadFromStorage();
        this.startPolling();
    }

    private loadFromStorage() {
        if (!this.store) return;
        try {
            const saved = localStorage.getItem('notifications_cache');
            if (saved) {
                const parsed = JSON.parse(saved);
                runInAction(() => {
                    this.store!.notifications = parsed.map((n: any) => ({
                        ...n,
                        date: new Date(n.date)
                    }));
                });
            }
        } catch (e) {
            console.warn("Failed to load notifications cache", e);
        }
    }

    private saveToStorage() {
        if (!this.store) return;
        try {
            const data = this.store.notifications.map(n => ({
                ...n,
                date: n.date.toISOString() // Store as string
            }));
            localStorage.setItem('notifications_cache', JSON.stringify(data));
        } catch (e) {
            console.warn("Failed to save notifications cache", e);
        }
    }

    startPolling() {
        if (this.pollingInterval) return;
        // Initial fetch
        this.fetch();
        // Polling removed as per user request
    }

    stopPolling() {
        // No-op
    }

    async fetch() {
        if (!this.store) return;
        try {
            const data = await api.getNotifications();
            runInAction(() => {
                // Merge or Replace? Replace is simpler for now, ensuring sync.
                // If we want to keep some client-side state not in backend, merging is needed.
                // But notifications are usually source-of-truth from server.
                this.store!.notifications = data.map((n: any) => ({
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    date: new Date(n.createdAt),
                    isRead: n.isRead,
                    inviterName: n.data?.inviterName,
                    workspaceName: n.data?.workspaceName,
                    data: n.data
                }));
                this.saveToStorage();
            });
        } catch (err) {
            console.error("[NotificationSync] Fetch failed", err);
        }
    }

    // Call this when store updates optimistically to persist changes immediately
    persist() {
        this.saveToStorage();
    }
}

export const notificationSyncStrategy = new NotificationSyncStrategy();
