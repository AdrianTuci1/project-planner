import { makeAutoObservable } from "mobx";
import { ProjectStore } from "../store";
import { api } from "../../services/api";

export type NotificationType = 'announcement' | 'invite';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    date: Date;
    isRead: boolean;
    // For invite
    inviterName?: string;
    workspaceName?: string;
    data?: any;
}

export class NotificationStore {
    rootStore: ProjectStore;
    notifications: Notification[] = [];

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
        this.fetchNotifications();
    }

    async fetchNotifications() {
        try {
            const data = await api.getNotifications();
            this.notifications = data.map((n: any) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                date: new Date(n.createdAt),
                isRead: n.isRead,
                // data payload mapping
                inviterName: n.data?.inviterName,
                workspaceName: n.data?.workspaceName,
                data: n.data
            }));
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    }

    get hasUnread() {
        return this.notifications.some(n => !n.isRead);
    }

    addNotification(notification: Notification) {
        this.notifications.unshift(notification);
    }

    markAsRead(id: string) {
        const note = this.notifications.find(n => n.id === id);
        if (note) {
            note.isRead = true;
            api.markNotificationRead(id).catch((err: any) => console.error("Failed to mark read", err));
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => {
            if (!n.isRead) this.markAsRead(n.id);
        });
    }

    deleteNotification(id: string) {
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    async handleInvite(id: string, accept: boolean) {
        try {
            const note = this.notifications.find(n => n.id === id);
            // If the notification `data` contains `inviteId`, use it.
            const inviteId = note?.data?.inviteId || note?.data?.id; // fallback

            if (!inviteId) {
                console.error("Invite ID not found on notification");
                return;
            }

            await api.respondToInvite(inviteId, accept);
            this.deleteNotification(id);

            if (accept) {
                // Refresh data to show new workspace
                if (this.rootStore.taskStore) {
                    this.rootStore.taskStore.initializeData();
                }
            }
        } catch (err) {
            console.error("Failed to respond to invite", err);
        }
    }
}
