import { makeAutoObservable, runInAction } from "mobx";
import { ProjectStore } from "../store";
import { api } from "../../services/api";
// import { notificationSyncStrategy } from "../strategies/NotificationSyncStrategy"; // Obsolete

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
    }

    handleRealtimeUpdate(type: string, data: any) {
        runInAction(() => {
            switch (type) {
                case 'notification.created':
                    this.addNotification({
                        id: data.id,
                        type: data.type,
                        title: data.title,
                        message: data.message,
                        date: new Date(data.createdAt),
                        isRead: data.isRead,
                        inviterName: data.data?.inviterName,
                        workspaceName: data.data?.workspaceName,
                        data: data.data
                    });
                    break;
                case 'notification.updated':
                    const notif = this.notifications.find(n => n.id === data.id);
                    if (notif) {
                        if (data.isRead !== undefined) notif.isRead = data.isRead;
                        if (data.type !== undefined) notif.type = data.type;
                        if (data.title !== undefined) notif.title = data.title;
                        if (data.message !== undefined) notif.message = data.message;
                        if (data.data !== undefined) notif.data = data.data;
                    }
                    break;
            }
        });
    }

    async fetchNotifications() {
        try {
            const data = await api.getNotifications();
            runInAction(() => {
                this.notifications = data.map((n: any) => ({
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
            });
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    }

    get hasUnread() {
        return this.notifications.some(n => !n.isRead);
    }

    addNotification(notification: Notification) {
        // Prevent duplicates
        if (this.notifications.some(n => n.id === notification.id)) return;
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
            const inviteId = note?.data?.inviteId || note?.data?.id;

            if (!inviteId) {
                console.error("Invite ID not found on notification");
                return;
            }

            await api.respondToInvite(inviteId, accept);
            this.deleteNotification(id);

            if (accept) {
                if (this.rootStore.workspaceStore) {
                    this.rootStore.workspaceStore.initializeData();
                }
            }
        } catch (err) {
            console.error("Failed to respond to invite", err);
        }
    }
}
